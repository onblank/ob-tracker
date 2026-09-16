import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { migrateDatabase, openDatabase } from './index';

const roots: string[] = [];
afterEach(() => { while (roots.length) rmSync(roots.pop()!, { recursive: true, force: true }); });

function makeDb() {
  const dir = mkdtempSync(join(tmpdir(), 'obt-db-'));
  roots.push(dir);
  const db = openDatabase(join(dir, 'test.sqlite'));
  migrateDatabase(db, resolve(process.cwd(), 'packages/db-sqlite/migrations'));
  return db;
}

const ids = {
  worker: '00000000-0000-4000-8000-000000000001',
  client: '00000000-0000-4000-8000-000000000002',
  project: '00000000-0000-4000-8000-000000000003',
  task: '00000000-0000-4000-8000-000000000004',
};

function seedHierarchy(db: ReturnType<typeof makeDb>) {
  const now = '2026-09-15T10:00:00.000Z';
  db.prepare('INSERT INTO workers VALUES (?, ?, ?, ?, ?)').run(ids.worker, 'Worker', null, now, now);
  db.prepare(`INSERT INTO clients(id,name,description,color_hex,work_type,created_at,updated_at,archived_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(ids.client, 'Client', '', null, 'billable', now, now, null);
  db.prepare(`INSERT INTO projects(id,client_id,name,description,status,color_hex,work_type_override,estimated_seconds,budget_amount_minor,budget_currency_code,created_at,updated_at,completed_at,archived_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ids.project, ids.client, 'Project', '', 'in_progress', null, null, null, null, null, now, now, null, null);
  db.prepare(`INSERT INTO tasks(id,project_id,name,description,status,color_hex,work_type_override,estimated_seconds,budget_amount_minor,budget_currency_code,created_at,updated_at,completed_at,archived_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(ids.task, ids.project, 'Task', '', 'in_progress', null, null, null, null, null, now, now, null, null);
}

describe('SQLite schema', () => {
  it('runs every migration', () => {
    const db = makeDb();
    expect((db.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get() as { count:number }).count).toBe(12);
    db.close();
  });

  it('rejects overlapping entries and permits touching intervals', () => {
    const db = makeDb(); seedHierarchy(db);
    const insert = db.prepare(`INSERT INTO time_entries(
      id,worker_id,client_id,project_id,task_id,started_at,ended_at,started_timezone,started_utc_offset_minutes,ended_timezone,ended_utc_offset_minutes,note,source,stop_reason,work_type_snapshot,billing_model_snapshot,billing_term_id_snapshot,hourly_rate_minor_snapshot,currency_code_snapshot,rounding_mode_snapshot,rounding_increment_minutes_snapshot,raw_duration_seconds,rounded_duration_seconds,calculated_amount_minor,created_at,updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const row = (id:string,start:string,end:string) => [id,ids.worker,ids.client,ids.project,ids.task,start,end,'Europe/Madrid',120,'Europe/Madrid',120,'','manual','manual','billable','none',null,null,null,'none',1,3600,3600,0,start,start];
    insert.run(...row('00000000-0000-4000-8000-000000000010','2026-09-15T10:00:00.000Z','2026-09-15T11:00:00.000Z'));
    expect(() => insert.run(...row('00000000-0000-4000-8000-000000000011','2026-09-15T10:30:00.000Z','2026-09-15T11:30:00.000Z'))).toThrow(/overlaps/);
    expect(() => insert.run(...row('00000000-0000-4000-8000-000000000012','2026-09-15T11:00:00.000Z','2026-09-15T12:00:00.000Z'))).not.toThrow();
    db.close();
  });

  it('allows at most one active timer', () => {
    const db = makeDb(); seedHierarchy(db);
    const sql = `INSERT INTO time_entries(id,worker_id,client_id,project_id,task_id,started_at,ended_at,started_timezone,started_utc_offset_minutes,ended_timezone,ended_utc_offset_minutes,note,source,stop_reason,work_type_snapshot,billing_model_snapshot,billing_term_id_snapshot,hourly_rate_minor_snapshot,currency_code_snapshot,rounding_mode_snapshot,rounding_increment_minutes_snapshot,raw_duration_seconds,rounded_duration_seconds,calculated_amount_minor,created_at,updated_at) VALUES (?,?,?,?,?, ?,NULL,?, ?,NULL,NULL,'','timer',NULL,'billable','none',NULL,NULL,NULL,'none',1,NULL,NULL,NULL,?,?)`;
    const insert=db.prepare(sql);
    insert.run('00000000-0000-4000-8000-000000000020',ids.worker,ids.client,ids.project,ids.task,'2026-09-15T10:00:00.000Z','Europe/Madrid',120,'2026-09-15T10:00:00.000Z','2026-09-15T10:00:00.000Z');
    expect(()=>insert.run('00000000-0000-4000-8000-000000000021',ids.worker,ids.client,ids.project,ids.task,'2026-09-15T11:00:00.000Z','Europe/Madrid',120,'2026-09-15T11:00:00.000Z','2026-09-15T11:00:00.000Z')).toThrow();
    db.close();
  });
});
