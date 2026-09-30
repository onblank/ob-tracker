import { z } from 'zod';
import { calculateClosedTimeEntry, resolveEntryBillingTerm, resolveWorkType } from '@obt/domain';
import type {
  BillingTerm,
  BillingTermRepository,
  Client,
  ClientRepository,
  Clock,
  IdGenerator,
  Project,
  ProjectRepository,
  SettingsRepository,
  TimeEntry,
  TimeEntryListItem,
  TimeEntryRepository,
  TimeZoneProvider,
  UnitOfWork,
  WorkerRepository,
} from '@obt/contracts';

const createClientSchema = z.object({
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2_000).default(''),
});

const createProjectSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().max(2_000).default(''),
});

const startTimerSchema = z.object({
  projectId: z.string().uuid(),
  note: z.string().trim().max(2_000).default(''),
});

export type CreateClientInput = z.input<typeof createClientSchema>;
export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type StartTimerInput = z.input<typeof startTimerSchema>;

export interface TodayTotals {
  readonly trackedSeconds: number;
  readonly billableSeconds: number;
  readonly nonBillableSeconds: number;
  readonly learningSeconds: number;
}

export interface TrackerState {
  readonly clients: Client[];
  readonly projects: Project[];
  readonly activeEntry: TimeEntryListItem | null;
  readonly todayEntries: TimeEntryListItem[];
  readonly todayTotals: TodayTotals;
}

function localStartOfDay(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function calculateTodayTotals(entries: TimeEntryListItem[]): TodayTotals {
  return entries.reduce<TodayTotals>(
    (totals, entry) => {
      const seconds = entry.rawDurationSeconds ?? 0;
      return {
        trackedSeconds: totals.trackedSeconds + seconds,
        billableSeconds:
          totals.billableSeconds + (entry.workTypeSnapshot === 'billable' ? seconds : 0),
        nonBillableSeconds:
          totals.nonBillableSeconds + (entry.workTypeSnapshot === 'non_billable' ? seconds : 0),
        learningSeconds:
          totals.learningSeconds + (entry.workTypeSnapshot === 'learning' ? seconds : 0),
      };
    },
    { trackedSeconds: 0, billableSeconds: 0, nonBillableSeconds: 0, learningSeconds: 0 },
  );
}

export class GetTrackerState {
  public constructor(
    private readonly workers: WorkerRepository,
    private readonly clients: ClientRepository,
    private readonly projects: ProjectRepository,
    private readonly entries: TimeEntryRepository,
    private readonly clock: Clock,
  ) {}

  public execute(): TrackerState {
    const worker = this.workers.getLocal();
    if (!worker) throw new Error('Complete onboarding before using the tracker.');
    const todayEntries = this.entries.listSince(worker.id, localStartOfDay(this.clock.now()));
    return {
      clients: this.clients.listActive(),
      projects: this.projects.listActive(),
      activeEntry: this.entries.getActive(worker.id),
      todayEntries,
      todayTotals: calculateTodayTotals(todayEntries),
    };
  }
}

export class CreateClient {
  public constructor(
    private readonly clients: ClientRepository,
    private readonly billingTerms: BillingTermRepository,
    private readonly settings: SettingsRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  public execute(rawInput: CreateClientInput): Client {
    const input = createClientSchema.parse(rawInput);
    const now = this.clock.now().toISOString();
    const settings = this.settings.get();
    const client: Client = {
      id: this.ids.generate(),
      name: input.name,
      description: input.description,
      colorHex: null,
      workType: settings.defaultWorkType,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    return this.unitOfWork.transaction(() => {
      this.clients.create(client);
      const canUseHourlyDefault =
        settings.defaultBillingModel === 'hourly' && settings.defaultHourlyRateMinor !== null;
      const billingTerm: BillingTerm = {
        id: this.ids.generate(),
        clientId: client.id,
        projectId: null,
        taskId: null,
        billingModel: canUseHourlyDefault ? 'hourly' : 'none',
        hourlyRateMinor: canUseHourlyDefault ? settings.defaultHourlyRateMinor : null,
        fixedAmountMinor: null,
        currencyCode: canUseHourlyDefault ? settings.defaultCurrencyCode : null,
        effectiveFrom: now,
        effectiveTo: null,
        createdAt: now,
      };
      this.billingTerms.create(billingTerm);
      return client;
    });
  }
}

export class CreateProject {
  public constructor(
    private readonly clients: ClientRepository,
    private readonly projects: ProjectRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  public execute(rawInput: CreateProjectInput): Project {
    const input = createProjectSchema.parse(rawInput);
    const client = this.clients.getById(input.clientId);
    if (!client || client.archivedAt !== null) throw new Error('Choose an active client.');
    const now = this.clock.now().toISOString();
    const project: Project = {
      id: this.ids.generate(),
      clientId: client.id,
      name: input.name,
      description: input.description,
      status: 'not_started',
      colorHex: null,
      workTypeOverride: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      archivedAt: null,
    };
    this.projects.create(project);
    return project;
  }
}

export class StartTimer {
  public constructor(
    private readonly workers: WorkerRepository,
    private readonly clients: ClientRepository,
    private readonly projects: ProjectRepository,
    private readonly billingTerms: BillingTermRepository,
    private readonly entries: TimeEntryRepository,
    private readonly settings: SettingsRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly timeZone: TimeZoneProvider,
    private readonly ids: IdGenerator,
  ) {}

  public execute(rawInput: StartTimerInput): TimeEntry {
    const input = startTimerSchema.parse(rawInput);
    const worker = this.workers.getLocal();
    if (!worker) throw new Error('Complete onboarding before starting a timer.');
    if (this.entries.getActive(worker.id))
      throw new Error('Stop the current timer before starting another.');
    const project = this.projects.getById(input.projectId);
    if (!project || project.archivedAt !== null) throw new Error('Choose an active project.');
    if (project.status === 'completed')
      throw new Error('Reopen the completed project before tracking time.');
    const client = this.clients.getById(project.clientId);
    if (!client || client.archivedAt !== null)
      throw new Error('The project client is archived or unavailable.');

    const now = this.clock.now().toISOString();
    const zone = this.timeZone.current();
    const settings = this.settings.get();
    const clientTerm = this.billingTerms.findEffectiveForClient(client.id, now);
    const projectTerm = this.billingTerms.findEffectiveForProject(project.id, now);
    const effectiveTerm = resolveEntryBillingTerm({
      client: clientTerm,
      project: projectTerm,
      task: null,
    });
    const billingModel = effectiveTerm?.billingModel ?? 'none';
    const entry: TimeEntry = {
      id: this.ids.generate(),
      workerId: worker.id,
      clientId: client.id,
      projectId: project.id,
      taskId: null,
      startedAt: now,
      endedAt: null,
      startedTimezone: zone.timeZone,
      startedUtcOffsetMinutes: zone.utcOffsetMinutes,
      endedTimezone: null,
      endedUtcOffsetMinutes: null,
      note: input.note,
      stopReason: null,
      workTypeSnapshot: resolveWorkType({
        client: client.workType,
        project: project.workTypeOverride,
      }),
      billingModelSnapshot: billingModel,
      billingTermIdSnapshot: effectiveTerm?.id ?? null,
      hourlyRateMinorSnapshot:
        billingModel === 'hourly' ? (effectiveTerm?.hourlyRateMinor ?? null) : null,
      currencyCodeSnapshot: billingModel === 'none' ? null : (effectiveTerm?.currencyCode ?? null),
      roundingModeSnapshot: settings.roundingMode,
      roundingIncrementMinutesSnapshot: settings.roundingIncrementMinutes,
      rawDurationSeconds: null,
      roundedDurationSeconds: null,
      calculatedAmountMinor: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.unitOfWork.transaction(() => {
      this.entries.create(entry);
      if (project.status === 'not_started') this.projects.markInProgress(project.id, now);
      return entry;
    });
  }
}

export class StopTimer {
  public constructor(
    private readonly workers: WorkerRepository,
    private readonly entries: TimeEntryRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
    private readonly timeZone: TimeZoneProvider,
  ) {}

  public execute(): void {
    const worker = this.workers.getLocal();
    if (!worker) throw new Error('Complete onboarding before stopping a timer.');
    const active = this.entries.getActive(worker.id);
    if (!active) throw new Error('There is no active timer to stop.');
    const endedAt = this.clock.now();
    const result = calculateClosedTimeEntry({
      startedAtMs: new Date(active.startedAt).getTime(),
      endedAtMs: endedAt.getTime(),
      workType: active.workTypeSnapshot,
      billingModel: active.billingModelSnapshot,
      hourlyRateMinor: active.hourlyRateMinorSnapshot,
      currencyCode: active.currencyCodeSnapshot,
      roundingMode: active.roundingModeSnapshot,
      roundingIncrementMinutes: active.roundingIncrementMinutesSnapshot,
    });
    const zone = this.timeZone.current();
    const endedAtIso = endedAt.toISOString();
    this.unitOfWork.transaction(() =>
      this.entries.close({
        id: active.id,
        endedAt: endedAtIso,
        endedTimezone: zone.timeZone,
        endedUtcOffsetMinutes: zone.utcOffsetMinutes,
        stopReason: 'manual',
        rawDurationSeconds: result.rawDurationSeconds,
        roundedDurationSeconds: result.roundedDurationSeconds,
        calculatedAmountMinor: result.calculatedAmountMinor,
        updatedAt: endedAtIso,
      }),
    );
  }
}
