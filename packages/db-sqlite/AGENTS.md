# AGENTS.md — packages/db-sqlite

Also read `../../AGENTS.md` and `../../../AGENTS.md`; both remain applicable to this subtree.

This is the only package that owns raw SQL and the SQLite implementation.

## Stack

- `better-sqlite3`
- no ORM
- foreign keys enabled
- WAL for the live DB
- explicit immutable SQL migrations

## Migration convention

Preserve onBlank ordering conventions while respecting SQLite capabilities:

- `001_initials.sql`: reference/type-like foundations and migration metadata. SQLite has no PostgreSQL schemas/domains/enums.
- `002_functions.sql`: intentionally reserved/no-op because SQLite has no persisted `CREATE FUNCTION`; register custom functions in `src/functions/`.
- `00x_feature.sql`: table + its indexes + its triggers together.

Never edit a migration after it has shipped in a public release. Add a new migration.

Any shared-domain schema change must update in the same change:
- SQL migration(s)
- `docs/DATA_MODEL.md`
- `docs/EXPORT_FORMAT.md` if portable fields change
- import/export schemas/tests

## Shared vs local

Shared/exportable tables:
`workers`, `clients`, `projects`, `tasks`, `billing_terms`, `time_entries`.

Desktop-only tables:
`favorites`, `app_settings`, `backup_history`, `import_history`, `schema_migrations`, reference tables.

Do not add Central-only platform entities here.

## Integrity

Keep important invariants in DB as defense in depth where they do not depend on the current clock/user settings. In particular, preserve FK hierarchy, one active timer, no overlaps and billing-term history integrity.

Time/future/autostop validation that depends on the current clock or settings belongs to domain/application logic too.

## Backups

Use SQLite-safe backup APIs/checkpoint/integrity workflows. Do not naïvely copy a live WAL database and call it a valid backup.
