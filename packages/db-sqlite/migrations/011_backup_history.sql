-- Local-only table. Not part of .obtracker exports.
CREATE TABLE backup_history (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  created_at TEXT NOT NULL,
  path TEXT NOT NULL CHECK (length(trim(path)) > 0),
  size_bytes INTEGER NULL CHECK (size_bytes IS NULL OR size_bytes >= 0),
  integrity_status TEXT NOT NULL CHECK (integrity_status IN ('ok', 'failed', 'unknown')),
  schema_version INTEGER NOT NULL CHECK (schema_version > 0),
  app_version TEXT NOT NULL CHECK (length(trim(app_version)) > 0)
) STRICT;
CREATE INDEX idx_backup_history_created_at ON backup_history(created_at DESC);
