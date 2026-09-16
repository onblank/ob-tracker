-- Local-only table. Not part of .obtracker exports.
CREATE TABLE favorites (
  id TEXT PRIMARY KEY CHECK (length(id) = 36),
  worker_id TEXT NOT NULL REFERENCES workers(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  client_id TEXT NULL REFERENCES clients(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  project_id TEXT NULL REFERENCES projects(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  task_id TEXT NULL REFERENCES tasks(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  CHECK ((client_id IS NOT NULL) + (project_id IS NOT NULL) + (task_id IS NOT NULL) = 1)
) STRICT;

CREATE UNIQUE INDEX ux_favorites_worker_client ON favorites(worker_id, client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX ux_favorites_worker_project ON favorites(worker_id, project_id) WHERE project_id IS NOT NULL;
CREATE UNIQUE INDEX ux_favorites_worker_task ON favorites(worker_id, task_id) WHERE task_id IS NOT NULL;
