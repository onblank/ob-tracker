CREATE TABLE billing_terms (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  client_id TEXT NULL REFERENCES clients(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  project_id TEXT NULL REFERENCES projects(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  task_id TEXT NULL REFERENCES tasks(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  billing_model TEXT NOT NULL REFERENCES ref_billing_models(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  hourly_rate_minor INTEGER NULL CHECK (hourly_rate_minor IS NULL OR hourly_rate_minor >= 0),
  fixed_amount_minor INTEGER NULL CHECK (fixed_amount_minor IS NULL OR fixed_amount_minor >= 0),
  currency_code TEXT NULL CHECK (currency_code IS NULL OR (length(currency_code) = 3 AND currency_code = upper(currency_code))),
  effective_from TEXT NOT NULL,
  effective_to TEXT NULL,
  created_at TEXT NOT NULL,
  CHECK ((client_id IS NOT NULL) + (project_id IS NOT NULL) + (task_id IS NOT NULL) = 1),
  CHECK (NOT (client_id IS NOT NULL AND billing_model = 'fixed')),
  CHECK (
    (billing_model = 'none' AND hourly_rate_minor IS NULL AND fixed_amount_minor IS NULL AND currency_code IS NULL)
    OR
    (billing_model = 'hourly' AND hourly_rate_minor IS NOT NULL AND fixed_amount_minor IS NULL AND currency_code IS NOT NULL)
    OR
    (billing_model = 'fixed' AND hourly_rate_minor IS NULL AND fixed_amount_minor IS NOT NULL AND currency_code IS NOT NULL)
  ),
  CHECK (effective_to IS NULL OR effective_to > effective_from)
) STRICT;

CREATE INDEX idx_billing_terms_client ON billing_terms(client_id, effective_from);
CREATE INDEX idx_billing_terms_project ON billing_terms(project_id, effective_from);
CREATE INDEX idx_billing_terms_task ON billing_terms(task_id, effective_from);
CREATE UNIQUE INDEX ux_billing_terms_current_client ON billing_terms(client_id) WHERE client_id IS NOT NULL AND effective_to IS NULL;
CREATE UNIQUE INDEX ux_billing_terms_current_project ON billing_terms(project_id) WHERE project_id IS NOT NULL AND effective_to IS NULL;
CREATE UNIQUE INDEX ux_billing_terms_current_task ON billing_terms(task_id) WHERE task_id IS NOT NULL AND effective_to IS NULL;

CREATE TRIGGER trg_billing_terms_prevent_overlap_insert
BEFORE INSERT ON billing_terms
WHEN EXISTS (
  SELECT 1 FROM billing_terms existing
  WHERE (
    (NEW.client_id IS NOT NULL AND existing.client_id = NEW.client_id)
    OR (NEW.project_id IS NOT NULL AND existing.project_id = NEW.project_id)
    OR (NEW.task_id IS NOT NULL AND existing.task_id = NEW.task_id)
  )
  AND NEW.effective_from < COALESCE(existing.effective_to, '9999-12-31T23:59:59.999Z')
  AND COALESCE(NEW.effective_to, '9999-12-31T23:59:59.999Z') > existing.effective_from
)
BEGIN
  SELECT RAISE(ABORT, 'billing term overlaps an existing term');
END;

CREATE TRIGGER trg_billing_terms_prevent_overlap_update
BEFORE UPDATE OF effective_to ON billing_terms
WHEN EXISTS (
  SELECT 1 FROM billing_terms existing
  WHERE existing.id <> NEW.id
  AND (
    (NEW.client_id IS NOT NULL AND existing.client_id = NEW.client_id)
    OR (NEW.project_id IS NOT NULL AND existing.project_id = NEW.project_id)
    OR (NEW.task_id IS NOT NULL AND existing.task_id = NEW.task_id)
  )
  AND NEW.effective_from < COALESCE(existing.effective_to, '9999-12-31T23:59:59.999Z')
  AND COALESCE(NEW.effective_to, '9999-12-31T23:59:59.999Z') > existing.effective_from
)
BEGIN
  SELECT RAISE(ABORT, 'billing term overlaps an existing term');
END;

CREATE TRIGGER trg_billing_terms_immutable_fields
BEFORE UPDATE ON billing_terms
WHEN
  NEW.id <> OLD.id OR
  NEW.client_id IS NOT OLD.client_id OR
  NEW.project_id IS NOT OLD.project_id OR
  NEW.task_id IS NOT OLD.task_id OR
  NEW.billing_model <> OLD.billing_model OR
  NEW.hourly_rate_minor IS NOT OLD.hourly_rate_minor OR
  NEW.fixed_amount_minor IS NOT OLD.fixed_amount_minor OR
  NEW.currency_code IS NOT OLD.currency_code OR
  NEW.effective_from <> OLD.effective_from OR
  NEW.created_at <> OLD.created_at OR
  OLD.effective_to IS NOT NULL OR
  NEW.effective_to IS NULL
BEGIN
  SELECT RAISE(ABORT, 'billing terms are immutable except for closing a current term');
END;

CREATE TRIGGER trg_billing_terms_prevent_delete
BEFORE DELETE ON billing_terms
BEGIN
  SELECT RAISE(ABORT, 'billing terms are historical records and cannot be deleted');
END;
