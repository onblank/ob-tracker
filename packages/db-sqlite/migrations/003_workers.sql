CREATE TABLE workers (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  display_name TEXT NOT NULL CHECK (length(trim(display_name)) BETWEEN 1 AND 120),
  company_name TEXT NULL CHECK (company_name IS NULL OR length(trim(company_name)) BETWEEN 1 AND 160),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (updated_at >= created_at)
) STRICT;
