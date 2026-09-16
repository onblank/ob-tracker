CREATE TABLE projects (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 180),
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'not_started' REFERENCES ref_entity_statuses(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  color_hex TEXT NULL CHECK (color_hex IS NULL OR (length(color_hex) = 7 AND substr(color_hex, 1, 1) = '#')),
  work_type_override TEXT NULL REFERENCES ref_work_types(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  estimated_seconds INTEGER NULL CHECK (estimated_seconds IS NULL OR estimated_seconds > 0),
  budget_amount_minor INTEGER NULL CHECK (budget_amount_minor IS NULL OR budget_amount_minor >= 0),
  budget_currency_code TEXT NULL CHECK (budget_currency_code IS NULL OR (length(budget_currency_code) = 3 AND budget_currency_code = upper(budget_currency_code))),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT NULL,
  archived_at TEXT NULL,
  CHECK ((budget_amount_minor IS NULL AND budget_currency_code IS NULL) OR (budget_amount_minor IS NOT NULL AND budget_currency_code IS NOT NULL)),
  CHECK ((status = 'completed' AND completed_at IS NOT NULL) OR (status <> 'completed' AND completed_at IS NULL)),
  CHECK (updated_at >= created_at),
  CHECK (completed_at IS NULL OR completed_at >= created_at),
  CHECK (archived_at IS NULL OR archived_at >= created_at)
) STRICT;

CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_name ON projects(name COLLATE NOCASE);
CREATE INDEX idx_projects_archived_at ON projects(archived_at);
