CREATE TABLE time_entries (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  worker_id TEXT NOT NULL REFERENCES workers(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  client_id TEXT NOT NULL REFERENCES clients(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  project_id TEXT NOT NULL REFERENCES projects(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  task_id TEXT NULL REFERENCES tasks(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

  started_at TEXT NOT NULL,
  ended_at TEXT NULL,
  started_timezone TEXT NOT NULL CHECK (length(trim(started_timezone)) > 0),
  started_utc_offset_minutes INTEGER NOT NULL CHECK (started_utc_offset_minutes BETWEEN -840 AND 840),
  ended_timezone TEXT NULL,
  ended_utc_offset_minutes INTEGER NULL CHECK (ended_utc_offset_minutes IS NULL OR ended_utc_offset_minutes BETWEEN -840 AND 840),

  note TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL REFERENCES ref_time_entry_sources(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  stop_reason TEXT NULL REFERENCES ref_stop_reasons(value) ON UPDATE RESTRICT ON DELETE RESTRICT,

  work_type_snapshot TEXT NOT NULL REFERENCES ref_work_types(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  billing_model_snapshot TEXT NOT NULL REFERENCES ref_billing_models(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  billing_term_id_snapshot TEXT NULL REFERENCES billing_terms(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  hourly_rate_minor_snapshot INTEGER NULL CHECK (hourly_rate_minor_snapshot IS NULL OR hourly_rate_minor_snapshot >= 0),
  currency_code_snapshot TEXT NULL CHECK (currency_code_snapshot IS NULL OR (length(currency_code_snapshot) = 3 AND currency_code_snapshot = upper(currency_code_snapshot))),
  rounding_mode_snapshot TEXT NOT NULL REFERENCES ref_rounding_modes(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  rounding_increment_minutes_snapshot INTEGER NOT NULL CHECK (rounding_increment_minutes_snapshot IN (1, 5, 6, 10, 15, 30, 60)),

  raw_duration_seconds INTEGER NULL CHECK (raw_duration_seconds IS NULL OR raw_duration_seconds > 0),
  rounded_duration_seconds INTEGER NULL CHECK (rounded_duration_seconds IS NULL OR rounded_duration_seconds > 0),
  calculated_amount_minor INTEGER NULL CHECK (calculated_amount_minor IS NULL OR calculated_amount_minor >= 0),

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  CHECK (updated_at >= created_at),
  CHECK (
    (billing_model_snapshot = 'none' AND hourly_rate_minor_snapshot IS NULL AND currency_code_snapshot IS NULL)
    OR
    (billing_model_snapshot = 'hourly' AND hourly_rate_minor_snapshot IS NOT NULL AND currency_code_snapshot IS NOT NULL)
    OR
    (billing_model_snapshot = 'fixed' AND hourly_rate_minor_snapshot IS NULL AND currency_code_snapshot IS NOT NULL)
  ),
  CHECK (
    (ended_at IS NULL AND ended_timezone IS NULL AND ended_utc_offset_minutes IS NULL AND stop_reason IS NULL AND raw_duration_seconds IS NULL AND rounded_duration_seconds IS NULL AND calculated_amount_minor IS NULL)
    OR
    (ended_at IS NOT NULL AND ended_timezone IS NOT NULL AND ended_utc_offset_minutes IS NOT NULL AND stop_reason IS NOT NULL AND raw_duration_seconds IS NOT NULL AND rounded_duration_seconds IS NOT NULL AND calculated_amount_minor IS NOT NULL)
  ),
  CHECK (ended_at IS NULL OR ended_at > started_at)
) STRICT;

CREATE INDEX idx_time_entries_worker_started ON time_entries(worker_id, started_at);
CREATE INDEX idx_time_entries_client_started ON time_entries(client_id, started_at);
CREATE INDEX idx_time_entries_project_started ON time_entries(project_id, started_at);
CREATE INDEX idx_time_entries_task_started ON time_entries(task_id, started_at);
CREATE INDEX idx_time_entries_work_type_started ON time_entries(work_type_snapshot, started_at);
CREATE UNIQUE INDEX ux_time_entries_one_active_per_worker ON time_entries(worker_id) WHERE ended_at IS NULL;

CREATE TRIGGER trg_time_entries_validate_hierarchy_insert
BEFORE INSERT ON time_entries
WHEN
  NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = NEW.project_id AND p.client_id = NEW.client_id)
  OR
  (NEW.task_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = NEW.task_id AND t.project_id = NEW.project_id))
BEGIN
  SELECT RAISE(ABORT, 'time entry client/project/task hierarchy is invalid');
END;

CREATE TRIGGER trg_time_entries_validate_hierarchy_update
BEFORE UPDATE OF client_id, project_id, task_id ON time_entries
WHEN
  NOT EXISTS (SELECT 1 FROM projects p WHERE p.id = NEW.project_id AND p.client_id = NEW.client_id)
  OR
  (NEW.task_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = NEW.task_id AND t.project_id = NEW.project_id))
BEGIN
  SELECT RAISE(ABORT, 'time entry client/project/task hierarchy is invalid');
END;

CREATE TRIGGER trg_time_entries_prevent_overlap_insert
BEFORE INSERT ON time_entries
WHEN EXISTS (
  SELECT 1 FROM time_entries existing
  WHERE existing.worker_id = NEW.worker_id
    AND NEW.started_at < COALESCE(existing.ended_at, '9999-12-31T23:59:59.999Z')
    AND COALESCE(NEW.ended_at, '9999-12-31T23:59:59.999Z') > existing.started_at
)
BEGIN
  SELECT RAISE(ABORT, 'time entry overlaps an existing entry');
END;

CREATE TRIGGER trg_time_entries_prevent_overlap_update
BEFORE UPDATE OF worker_id, started_at, ended_at ON time_entries
WHEN EXISTS (
  SELECT 1 FROM time_entries existing
  WHERE existing.id <> NEW.id
    AND existing.worker_id = NEW.worker_id
    AND NEW.started_at < COALESCE(existing.ended_at, '9999-12-31T23:59:59.999Z')
    AND COALESCE(NEW.ended_at, '9999-12-31T23:59:59.999Z') > existing.started_at
)
BEGIN
  SELECT RAISE(ABORT, 'time entry overlaps an existing entry');
END;
