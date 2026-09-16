# `.obtracker` Portable Format v1

`.obtracker` is the only intentional interoperability contract between OB-Tracker and external importers such as a future onBlank Central importer. OB-Tracker never connects to Central.

The file is a ZIP-compatible container with extension `.obtracker`.

## Contents

```text
manifest.json
workers.csv
clients.csv
projects.csv
tasks.csv
billing_terms.csv
time_entries.csv
```

Every shared-domain column from `docs/DATA_MODEL.md` is exported. Desktop-only columns/tables are never required by the format.

## Manifest

```json
{
  "format": "ob-tracker",
  "schemaVersion": 1,
  "exportId": "uuid",
  "appVersion": "0.1.0",
  "exportedAt": "2026-09-15T17:00:00.000Z",
  "workerId": "uuid",
  "files": [
    { "name": "workers.csv", "rowCount": 1, "sha256": "..." }
  ]
}
```

All listed file hashes are lowercase SHA-256 of the exact bytes in the archive.

## Exact v1 headers

```text
workers.csv
id,display_name,company_name,created_at,updated_at

clients.csv
id,name,description,color_hex,work_type,created_at,updated_at,archived_at

projects.csv
id,client_id,name,description,status,color_hex,work_type_override,estimated_seconds,budget_amount_minor,budget_currency_code,created_at,updated_at,completed_at,archived_at

tasks.csv
id,project_id,name,description,status,color_hex,work_type_override,estimated_seconds,budget_amount_minor,budget_currency_code,created_at,updated_at,completed_at,archived_at

billing_terms.csv
id,client_id,project_id,task_id,billing_model,hourly_rate_minor,fixed_amount_minor,currency_code,effective_from,effective_to,created_at

time_entries.csv
id,worker_id,client_id,project_id,task_id,started_at,ended_at,started_timezone,started_utc_offset_minutes,ended_timezone,ended_utc_offset_minutes,note,source,stop_reason,work_type_snapshot,billing_model_snapshot,billing_term_id_snapshot,hourly_rate_minor_snapshot,currency_code_snapshot,rounding_mode_snapshot,rounding_increment_minutes_snapshot,raw_duration_seconds,rounded_duration_seconds,calculated_amount_minor,created_at,updated_at
```

These headers are also exposed as constants by `@obt/import-export`; change them only with an explicit native schema-version change.

## CSV rules

- UTF-8.
- Header row required.
- Canonical snake_case field names match the shared SQL contract.
- Null is represented by an empty field.
- Empty textual values that are semantically non-null remain quoted empty strings when required by the CSV encoder.
- UUIDs remain stable.
- Instants use canonical ISO-8601 UTC strings.
- Money uses integer minor units.
- Currency uses uppercase three-letter code.
- Booleans are not currently part of the shared v1 tables.

## Import v1

Before any mutation:
1. validate container and manifest;
2. validate supported schema version;
3. validate each declared file/hash/row count;
4. validate CSV schemas/types/enums;
5. validate all foreign relationships and hierarchy;
6. validate no illegal overlaps;
7. validate billing-term history;
8. validate worker compatibility.

Apply the native import in one database transaction.

### Worker compatibility

- Empty installation may adopt the exported worker.
- Existing installation with the same worker UUID may import compatible data.
- Existing installation with a different worker UUID rejects the import.

### ID conflicts

For schema v1:
- same UUID + byte/semantic-equivalent shared record: idempotently skip;
- same UUID + conflicting record: abort the whole import;
- no partial merge heuristics.

A successful import writes desktop-only `import_history`; that history is never re-exported.

## Generic CSV

The user-facing “Export CSV” report is a separate format optimized for spreadsheets and people. It is not the migration contract and may contain denormalized display values.
