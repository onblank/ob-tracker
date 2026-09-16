-- OB-Tracker SQLite foundations.
-- SQLite has no CREATE SCHEMA / DOMAIN / ENUM TYPE. These reference tables provide
-- database-level enum integrity while keeping semantics portable to PostgreSQL.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
) STRICT;

CREATE TABLE ref_work_types (
  value TEXT PRIMARY KEY
) STRICT;
INSERT INTO ref_work_types(value) VALUES ('billable'), ('non_billable'), ('learning');

CREATE TABLE ref_entity_statuses (
  value TEXT PRIMARY KEY
) STRICT;
INSERT INTO ref_entity_statuses(value) VALUES ('not_started'), ('in_progress'), ('completed');

CREATE TABLE ref_billing_models (
  value TEXT PRIMARY KEY
) STRICT;
INSERT INTO ref_billing_models(value) VALUES ('none'), ('hourly'), ('fixed');

CREATE TABLE ref_rounding_modes (
  value TEXT PRIMARY KEY
) STRICT;
INSERT INTO ref_rounding_modes(value) VALUES ('none'), ('nearest'), ('up'), ('down');

CREATE TABLE ref_time_entry_sources (
  value TEXT PRIMARY KEY
) STRICT;
INSERT INTO ref_time_entry_sources(value) VALUES ('timer'), ('manual');

CREATE TABLE ref_stop_reasons (
  value TEXT PRIMARY KEY
) STRICT;
INSERT INTO ref_stop_reasons(value) VALUES
  ('manual'), ('switch_task'), ('auto_stop'), ('clock_change'), ('idle_split'), ('recovery');
