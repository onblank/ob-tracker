import type { AppSettings } from '@obt/settings';
import type {
  BillingModel,
  EntityStatus,
  RoundingIncrementMinutes,
  RoundingMode,
  WorkType,
} from '@obt/domain';

export interface Worker {
  readonly id: string;
  readonly displayName: string;
  readonly companyName: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Client {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly colorHex: string | null;
  readonly workType: WorkType;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
}

export interface Project {
  readonly id: string;
  readonly clientId: string;
  readonly name: string;
  readonly description: string;
  readonly status: EntityStatus;
  readonly colorHex: string | null;
  readonly workTypeOverride: WorkType | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly completedAt: string | null;
  readonly archivedAt: string | null;
}

export interface BillingTerm {
  readonly id: string;
  readonly clientId: string | null;
  readonly projectId: string | null;
  readonly taskId: string | null;
  readonly billingModel: BillingModel;
  readonly hourlyRateMinor: number | null;
  readonly fixedAmountMinor: number | null;
  readonly currencyCode: string | null;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly createdAt: string;
}

export interface TimeEntry {
  readonly id: string;
  readonly workerId: string;
  readonly clientId: string;
  readonly projectId: string;
  readonly taskId: string | null;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly startedTimezone: string;
  readonly startedUtcOffsetMinutes: number;
  readonly endedTimezone: string | null;
  readonly endedUtcOffsetMinutes: number | null;
  readonly note: string;
  readonly stopReason:
    'manual' | 'switch_task' | 'auto_stop' | 'clock_change' | 'idle_split' | 'recovery' | null;
  readonly workTypeSnapshot: WorkType;
  readonly billingModelSnapshot: BillingModel;
  readonly billingTermIdSnapshot: string | null;
  readonly hourlyRateMinorSnapshot: number | null;
  readonly currencyCodeSnapshot: string | null;
  readonly roundingModeSnapshot: RoundingMode;
  readonly roundingIncrementMinutesSnapshot: RoundingIncrementMinutes;
  readonly rawDurationSeconds: number | null;
  readonly roundedDurationSeconds: number | null;
  readonly calculatedAmountMinor: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TimeEntryListItem extends TimeEntry {
  readonly clientName: string;
  readonly projectName: string;
}

export interface CloseTimeEntryInput {
  readonly id: string;
  readonly endedAt: string;
  readonly endedTimezone: string;
  readonly endedUtcOffsetMinutes: number;
  readonly stopReason: NonNullable<TimeEntry['stopReason']>;
  readonly rawDurationSeconds: number;
  readonly roundedDurationSeconds: number;
  readonly calculatedAmountMinor: number;
  readonly updatedAt: string;
}

export interface WorkerRepository {
  getLocal(): Worker | null;
  create(input: Worker): void;
}
export interface ClientRepository {
  listActive(): Client[];
  getById(id: string): Client | null;
  create(input: Client): void;
}
export interface ProjectRepository {
  listActive(): Project[];
  getById(id: string): Project | null;
  create(input: Project): void;
  markInProgress(id: string, updatedAt: string): void;
}
export interface BillingTermRepository {
  findEffectiveForClient(clientId: string, at: string): BillingTerm | null;
  findEffectiveForProject(projectId: string, at: string): BillingTerm | null;
  create(input: BillingTerm): void;
}
export interface TimeEntryRepository {
  getActive(workerId: string): TimeEntryListItem | null;
  create(input: TimeEntry): void;
  close(input: CloseTimeEntryInput): void;
  listSince(workerId: string, since: string): TimeEntryListItem[];
}
export interface SettingsRepository {
  get(): AppSettings;
  update(settings: AppSettings): void;
}
export interface Clock {
  now(): Date;
  monotonicMilliseconds(): number;
}
export interface TimeZoneProvider {
  current(): { readonly timeZone: string; readonly utcOffsetMinutes: number };
}
export interface IdGenerator {
  generate(): string;
}
export interface UnitOfWork {
  transaction<T>(work: () => T): T;
}
