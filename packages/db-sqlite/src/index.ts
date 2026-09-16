import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { AppSettings } from '@obt/settings';
import { settingsSchema } from '@obt/settings';
import type { SettingsRepository, UnitOfWork, Worker, WorkerRepository } from '@obt/contracts';

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

  const applied = db.prepare('SELECT version FROM schema_migrations').all() as Array<{ version: number }>;
  const versions = new Set(applied.map(({ version }) => version));

  for (const file of files) {
    const version = Number(file.slice(0, 3));
    if (versions.has(version)) continue;
    const sql = readFileSync(join(migrationsDirectory, file), 'utf8');
    const apply = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations(version, name, applied_at) VALUES (?, ?, ?)')
        .run(version, file, new Date().toISOString());
    });
    apply();
  }
}

export class SqliteWorkerRepository implements WorkerRepository {
  public constructor(private readonly db: SqliteDatabase) {}

  public getLocal(): Worker | null {
    const row = this.db.prepare(`
      SELECT id, display_name, company_name, created_at, updated_at
      FROM workers
      ORDER BY created_at ASC
      LIMIT 1
    `).get() as { id: string; display_name: string; company_name: string | null; created_at: string; updated_at: string } | undefined;

    return row
      ? { id: row.id, displayName: row.display_name, companyName: row.company_name, createdAt: row.created_at, updatedAt: row.updated_at }
      : null;
  }

  public create(worker: Worker): void {
    this.db.prepare(`
      INSERT INTO workers(id, display_name, company_name, created_at, updated_at)
      VALUES (@id, @displayName, @companyName, @createdAt, @updatedAt)
    `).run(worker);
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
    const row = this.db.prepare('SELECT * FROM app_settings WHERE id = 1').get() as SettingsRow | undefined;
    if (!row) throw new Error('app_settings singleton row is missing');
    return mapSettings(row);
  }

  public update(settings: AppSettings): void {
    const value = settingsSchema.parse(settings);
    this.db.prepare(`
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
    `).run({
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
