CREATE TABLE clients (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 180),
  description TEXT NOT NULL DEFAULT '',
  color_hex TEXT NULL CHECK (color_hex IS NULL OR (length(color_hex) = 7 AND substr(color_hex, 1, 1) = '#')),
  work_type TEXT NOT NULL REFERENCES ref_work_types(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT NULL,
  CHECK (updated_at >= created_at),
  CHECK (archived_at IS NULL OR archived_at >= created_at)
) STRICT;

CREATE INDEX idx_clients_name ON clients(name COLLATE NOCASE);
CREATE INDEX idx_clients_archived_at ON clients(archived_at);
