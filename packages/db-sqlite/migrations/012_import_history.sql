-- Local-only table. Not part of .obtracker exports.
CREATE TABLE import_history (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  export_id TEXT NOT NULL UNIQUE CHECK (length(export_id) = 36),
  imported_at TEXT NOT NULL,
  schema_version INTEGER NOT NULL CHECK (schema_version > 0),
  file_hash_sha256 TEXT NOT NULL UNIQUE CHECK (length(file_hash_sha256) = 64),
  source_filename TEXT NULL
) STRICT;
CREATE INDEX idx_import_history_imported_at ON import_history(imported_at DESC);
