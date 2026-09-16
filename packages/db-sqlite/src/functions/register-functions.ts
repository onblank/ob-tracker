import type { SqliteDatabase } from '../index';

/**
 * SQLite has no persisted CREATE FUNCTION migration syntax. Register future
 * deterministic custom functions here at connection bootstrap time.
 */
export function registerSqliteFunctions(_db: SqliteDatabase): void {
  // Intentionally empty in schema v1.
}
