import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { AppSettings } from '@obt/settings';
import { settingsSchema } from '@obt/settings';
import type {
  BillingTerm,
  BillingTermRepository,
  Client,
  ClientRepository,
  CloseTimeEntryInput,
  Project,
  ProjectRepository,
  SettingsRepository,
  TimeEntry,
  TimeEntryListItem,
  TimeEntryRepository,
  UnitOfWork,
  Worker,
  WorkerRepository,
} from '@obt/contracts';

export type SqliteDatabase = Database.Database;

export function openDatabase(filename: string): SqliteDatabase {
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('busy_timeout = 5000');
  return db;
}

export function migrateDatabase(db: SqliteDatabase, migrationsDirectory: string): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);

  const files = readdirSync(migrationsDirectory)
    .filter((name) => /^\d{3}_.+\.sql$/.test(name))
    .sort((a, b) => a.localeCompare(b));

  const applied = db.prepare('SELECT version FROM schema_migrations').all() as Array<{
    version: number;
  }>;
  const versions = new Set(applied.map(({ version }) => version));

  for (const file of files) {
    const version = Number(file.slice(0, 3));
    if (versions.has(version)) continue;
    const sql = readFileSync(join(migrationsDirectory, file), 'utf8');
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)').run(
        version,
        file,
        new Date().toISOString(),
      );
    });
    apply();
  }
}

export class SqliteWorkerRepository implements WorkerRepository {
  public constructor(private readonly db: SqliteDatabase) {}

  public getLocal(): Worker | null {
    const row = this.db
      .prepare(
        `
      SELECT id, display_name, company_name, created_at, updated_at
      FROM workers
      ORDER BY created_at ASC
      LIMIT 1
    `,
      )
      .get() as
      | {
          id: string;
          display_name: string;
          company_name: string | null;
          created_at: string;
          updated_at: string;
        }
      | undefined;

    return row
      ? {
          id: row.id,
          displayName: row.display_name,
          companyName: row.company_name,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      : null;
  }

  public create(worker: Worker): void {
    this.db
      .prepare(
        `
      INSERT INTO workers(id, display_name, company_name, created_at, updated_at)
      VALUES (@id, @displayName, @companyName, @createdAt, @updatedAt)
    `,
      )
      .run(worker);
  }
}

type ClientRow = {
  id: string;
  name: string;
  description: string;
  color_hex: string | null;
  work_type: Client['workType'];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

function mapClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    colorHex: row.color_hex,
    workType: row.work_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

export class SqliteClientRepository implements ClientRepository {
  public constructor(private readonly db: SqliteDatabase) {}

  public listActive(): Client[] {
    const rows = this.db
      .prepare(
        `
      SELECT id, name, description, color_hex, work_type, created_at, updated_at, archived_at
      FROM clients
      WHERE archived_at IS NULL
      ORDER BY name COLLATE NOCASE, created_at
    `,
      )
      .all() as ClientRow[];
    return rows.map(mapClient);
  }

  public getById(id: string): Client | null {
    const row = this.db
      .prepare(
        `
      SELECT id, name, description, color_hex, work_type, created_at, updated_at, archived_at
      FROM clients WHERE id = ?
    `,
      )
      .get(id) as ClientRow | undefined;
    return row ? mapClient(row) : null;
  }

  public create(client: Client): void {
    this.db
      .prepare(
        `
      INSERT INTO clients(id, name, description, color_hex, work_type, created_at, updated_at, archived_at)
      VALUES (@id, @name, @description, @colorHex, @workType, @createdAt, @updatedAt, @archivedAt)
    `,
      )
      .run(client);
  }
}

type ProjectRow = {
  id: string;
  client_id: string;
  name: string;
  description: string;
  status: Project['status'];
  color_hex: string | null;
  work_type_override: Project['workTypeOverride'];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  archived_at: string | null;
};

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name,
    description: row.description,
    status: row.status,
    colorHex: row.color_hex,
    workTypeOverride: row.work_type_override,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
    archivedAt: row.archived_at,
  };
}

export class SqliteProjectRepository implements ProjectRepository {
  public constructor(private readonly db: SqliteDatabase) {}

  public listActive(): Project[] {
    const rows = this.db
      .prepare(
        `
      SELECT id, client_id, name, description, status, color_hex, work_type_override,
             created_at, updated_at, completed_at, archived_at
      FROM projects
      WHERE archived_at IS NULL
      ORDER BY name COLLATE NOCASE, created_at
    `,
      )
      .all() as ProjectRow[];
    return rows.map(mapProject);
  }

  public getById(id: string): Project | null {
    const row = this.db
      .prepare(
        `
      SELECT id, client_id, name, description, status, color_hex, work_type_override,
             created_at, updated_at, completed_at, archived_at
      FROM projects WHERE id = ?
    `,
      )
      .get(id) as ProjectRow | undefined;
    return row ? mapProject(row) : null;
  }

  public create(project: Project): void {
    this.db
      .prepare(
        `
      INSERT INTO projects(
        id, client_id, name, description, status, color_hex, work_type_override,
        created_at, updated_at, completed_at, archived_at
      ) VALUES (
        @id, @clientId, @name, @description, @status, @colorHex, @workTypeOverride,
        @createdAt, @updatedAt, @completedAt, @archivedAt
      )
    `,
      )
      .run(project);
  }

  public markInProgress(id: string, updatedAt: string): void {
    this.db
      .prepare(
        `
      UPDATE projects SET status = 'in_progress', updated_at = ?
      WHERE id = ? AND status = 'not_started'
    `,
      )
      .run(updatedAt, id);
  }
}

type BillingTermRow = {
  id: string;
  client_id: string | null;
  project_id: string | null;
  task_id: string | null;
  billing_model: BillingTerm['billingModel'];
  hourly_rate_minor: number | null;
  fixed_amount_minor: number | null;
  currency_code: string | null;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
};

function mapBillingTerm(row: BillingTermRow): BillingTerm {
  return {
    id: row.id,
    clientId: row.client_id,
    projectId: row.project_id,
    taskId: row.task_id,
    billingModel: row.billing_model,
    hourlyRateMinor: row.hourly_rate_minor,
    fixedAmountMinor: row.fixed_amount_minor,
    currencyCode: row.currency_code,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    createdAt: row.created_at,
  };
}

export class SqliteBillingTermRepository implements BillingTermRepository {
  public constructor(private readonly db: SqliteDatabase) {}

  private findEffective(
    column: 'client_id' | 'project_id',
    id: string,
    at: string,
  ): BillingTerm | null {
    const row = this.db
      .prepare(
        `
      SELECT id, client_id, project_id, task_id, billing_model, hourly_rate_minor,
             fixed_amount_minor, currency_code, effective_from, effective_to, created_at
      FROM billing_terms
      WHERE ${column} = ? AND effective_from <= ? AND (effective_to IS NULL OR effective_to > ?)
      ORDER BY effective_from DESC LIMIT 1
    `,
      )
      .get(id, at, at) as BillingTermRow | undefined;
    return row ? mapBillingTerm(row) : null;
  }

  public findEffectiveForClient(clientId: string, at: string): BillingTerm | null {
    return this.findEffective('client_id', clientId, at);
  }

  public findEffectiveForProject(projectId: string, at: string): BillingTerm | null {
    return this.findEffective('project_id', projectId, at);
  }

  public create(term: BillingTerm): void {
    this.db
      .prepare(
        `
      INSERT INTO billing_terms(
        id, client_id, project_id, task_id, billing_model, hourly_rate_minor,
        fixed_amount_minor, currency_code, effective_from, effective_to, created_at
      ) VALUES (
        @id, @clientId, @projectId, @taskId, @billingModel, @hourlyRateMinor,
        @fixedAmountMinor, @currencyCode, @effectiveFrom, @effectiveTo, @createdAt
      )
    `,
      )
      .run(term);
  }
}

type TimeEntryRow = {
  id: string;
  worker_id: string;
  client_id: string;
  project_id: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  started_timezone: string;
  started_utc_offset_minutes: number;
  ended_timezone: string | null;
  ended_utc_offset_minutes: number | null;
  note: string;
  stop_reason: TimeEntry['stopReason'];
  work_type_snapshot: TimeEntry['workTypeSnapshot'];
  billing_model_snapshot: TimeEntry['billingModelSnapshot'];
  billing_term_id_snapshot: string | null;
  hourly_rate_minor_snapshot: number | null;
  currency_code_snapshot: string | null;
  rounding_mode_snapshot: TimeEntry['roundingModeSnapshot'];
  rounding_increment_minutes_snapshot: TimeEntry['roundingIncrementMinutesSnapshot'];
  raw_duration_seconds: number | null;
  rounded_duration_seconds: number | null;
  calculated_amount_minor: number | null;
  created_at: string;
  updated_at: string;
  client_name: string;
  project_name: string;
};

const TIME_ENTRY_SELECT = `
  SELECT e.id, e.worker_id, e.client_id, e.project_id, e.task_id,
         e.started_at, e.ended_at, e.started_timezone, e.started_utc_offset_minutes,
         e.ended_timezone, e.ended_utc_offset_minutes, e.note, e.stop_reason,
         e.work_type_snapshot, e.billing_model_snapshot, e.billing_term_id_snapshot,
         e.hourly_rate_minor_snapshot, e.currency_code_snapshot, e.rounding_mode_snapshot,
         e.rounding_increment_minutes_snapshot, e.raw_duration_seconds,
         e.rounded_duration_seconds, e.calculated_amount_minor, e.created_at, e.updated_at,
         c.name AS client_name, p.name AS project_name
  FROM time_entries e
  JOIN clients c ON c.id = e.client_id
  JOIN projects p ON p.id = e.project_id
`;

function mapTimeEntry(row: TimeEntryRow): TimeEntryListItem {
  return {
    id: row.id,
    workerId: row.worker_id,
    clientId: row.client_id,
    projectId: row.project_id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    startedTimezone: row.started_timezone,
    startedUtcOffsetMinutes: row.started_utc_offset_minutes,
    endedTimezone: row.ended_timezone,
    endedUtcOffsetMinutes: row.ended_utc_offset_minutes,
    note: row.note,
    stopReason: row.stop_reason,
    workTypeSnapshot: row.work_type_snapshot,
    billingModelSnapshot: row.billing_model_snapshot,
    billingTermIdSnapshot: row.billing_term_id_snapshot,
    hourlyRateMinorSnapshot: row.hourly_rate_minor_snapshot,
    currencyCodeSnapshot: row.currency_code_snapshot,
    roundingModeSnapshot: row.rounding_mode_snapshot,
    roundingIncrementMinutesSnapshot: row.rounding_increment_minutes_snapshot,
    rawDurationSeconds: row.raw_duration_seconds,
    roundedDurationSeconds: row.rounded_duration_seconds,
    calculatedAmountMinor: row.calculated_amount_minor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientName: row.client_name,
    projectName: row.project_name,
  };
}

export class SqliteTimeEntryRepository implements TimeEntryRepository {
  public constructor(private readonly db: SqliteDatabase) {}

  public getActive(workerId: string): TimeEntryListItem | null {
    const row = this.db
      .prepare(
        `${TIME_ENTRY_SELECT}
      WHERE e.worker_id = ? AND e.ended_at IS NULL LIMIT 1
    `,
      )
      .get(workerId) as TimeEntryRow | undefined;
    return row ? mapTimeEntry(row) : null;
  }

  public create(entry: TimeEntry): void {
    this.db
      .prepare(
        `
      INSERT INTO time_entries(
        id, worker_id, client_id, project_id, task_id, started_at, ended_at,
        started_timezone, started_utc_offset_minutes, ended_timezone, ended_utc_offset_minutes,
        note, source, stop_reason, work_type_snapshot, billing_model_snapshot,
        billing_term_id_snapshot, hourly_rate_minor_snapshot, currency_code_snapshot,
        rounding_mode_snapshot, rounding_increment_minutes_snapshot, raw_duration_seconds,
        rounded_duration_seconds, calculated_amount_minor, created_at, updated_at
      ) VALUES (
        @id, @workerId, @clientId, @projectId, @taskId, @startedAt, @endedAt,
        @startedTimezone, @startedUtcOffsetMinutes, @endedTimezone, @endedUtcOffsetMinutes,
        @note, 'timer', @stopReason, @workTypeSnapshot, @billingModelSnapshot,
        @billingTermIdSnapshot, @hourlyRateMinorSnapshot, @currencyCodeSnapshot,
        @roundingModeSnapshot, @roundingIncrementMinutesSnapshot, @rawDurationSeconds,
        @roundedDurationSeconds, @calculatedAmountMinor, @createdAt, @updatedAt
      )
    `,
      )
      .run(entry);
  }

  public close(input: CloseTimeEntryInput): void {
    const result = this.db
      .prepare(
        `
      UPDATE time_entries SET
        ended_at = @endedAt,
        ended_timezone = @endedTimezone,
        ended_utc_offset_minutes = @endedUtcOffsetMinutes,
        stop_reason = @stopReason,
        raw_duration_seconds = @rawDurationSeconds,
        rounded_duration_seconds = @roundedDurationSeconds,
        calculated_amount_minor = @calculatedAmountMinor,
        updated_at = @updatedAt
      WHERE id = @id AND ended_at IS NULL
    `,
      )
      .run(input);
    if (result.changes !== 1) throw new Error('Active time entry could not be closed.');
  }

  public listSince(workerId: string, since: string): TimeEntryListItem[] {
    const rows = this.db
      .prepare(
        `${TIME_ENTRY_SELECT}
      WHERE e.worker_id = ? AND e.started_at >= ? AND e.ended_at IS NOT NULL
      ORDER BY e.started_at DESC
    `,
      )
      .all(workerId, since) as TimeEntryRow[];
    return rows.map(mapTimeEntry);
  }
}

type SettingsRow = {
  language: string;
  default_currency_code: string;
  default_work_type: AppSettings['defaultWorkType'];
  default_billing_model: AppSettings['defaultBillingModel'];
  default_hourly_rate_minor: number | null;
  auto_stop_enabled: number;
  auto_stop_seconds: number;
  idle_detection_enabled: number;
  idle_threshold_seconds: number;
  rounding_mode: AppSettings['roundingMode'];
  rounding_increment_minutes: AppSettings['roundingIncrementMinutes'];
  first_day_of_week: AppSettings['firstDayOfWeek'];
  time_format: AppSettings['timeFormat'];
  date_format: AppSettings['dateFormat'];
  theme: AppSettings['theme'];
  backup_reminder_days: number;
  backup_retention_count: number;
  backup_directory: string | null;
  backup_reminder_snoozed_until: string | null;
  global_shortcut: string | null;
  minimize_to_tray: number;
};

function mapSettings(row: SettingsRow): AppSettings {
  return settingsSchema.parse({
    language: row.language,
    defaultCurrencyCode: row.default_currency_code,
    defaultWorkType: row.default_work_type,
    defaultBillingModel: row.default_billing_model,
    defaultHourlyRateMinor: row.default_hourly_rate_minor,
    autoStopEnabled: Boolean(row.auto_stop_enabled),
    autoStopSeconds: row.auto_stop_seconds,
    idleDetectionEnabled: Boolean(row.idle_detection_enabled),
    idleThresholdSeconds: row.idle_threshold_seconds,
    roundingMode: row.rounding_mode,
    roundingIncrementMinutes: row.rounding_increment_minutes,
    firstDayOfWeek: row.first_day_of_week,
    timeFormat: row.time_format,
    dateFormat: row.date_format,
    theme: row.theme,
    backupReminderDays: row.backup_reminder_days,
    backupRetentionCount: row.backup_retention_count,
    backupDirectory: row.backup_directory,
    backupReminderSnoozedUntil: row.backup_reminder_snoozed_until,
    globalShortcut: row.global_shortcut,
    minimizeToTray: Boolean(row.minimize_to_tray),
  });
}

export class SqliteSettingsRepository implements SettingsRepository {
  public constructor(private readonly db: SqliteDatabase) {}

  public get(): AppSettings {
    const row = this.db.prepare('SELECT * FROM app_settings WHERE id = 1').get() as
      SettingsRow | undefined;
    if (!row) throw new Error('app_settings singleton row is missing');
    return mapSettings(row);
  }

  public update(settings: AppSettings): void {
    const value = settingsSchema.parse(settings);
    this.db
      .prepare(
        `
      UPDATE app_settings SET
        language = @language,
        default_currency_code = @defaultCurrencyCode,
        default_work_type = @defaultWorkType,
        default_billing_model = @defaultBillingModel,
        default_hourly_rate_minor = @defaultHourlyRateMinor,
        auto_stop_enabled = @autoStopEnabled,
        auto_stop_seconds = @autoStopSeconds,
        idle_detection_enabled = @idleDetectionEnabled,
        idle_threshold_seconds = @idleThresholdSeconds,
        rounding_mode = @roundingMode,
        rounding_increment_minutes = @roundingIncrementMinutes,
        first_day_of_week = @firstDayOfWeek,
        time_format = @timeFormat,
        date_format = @dateFormat,
        theme = @theme,
        backup_reminder_days = @backupReminderDays,
        backup_retention_count = @backupRetentionCount,
        backup_directory = @backupDirectory,
        backup_reminder_snoozed_until = @backupReminderSnoozedUntil,
        global_shortcut = @globalShortcut,
        minimize_to_tray = @minimizeToTray
      WHERE id = 1
    `,
      )
      .run({
        ...value,
        autoStopEnabled: Number(value.autoStopEnabled),
        idleDetectionEnabled: Number(value.idleDetectionEnabled),
        minimizeToTray: Number(value.minimizeToTray),
      });
  }
}

export class SqliteUnitOfWork implements UnitOfWork {
  public constructor(private readonly db: SqliteDatabase) {}
  public transaction<T>(work: () => T): T {
    return this.db.transaction(work)();
  }
}
