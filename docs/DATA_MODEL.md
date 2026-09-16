# OB-Tracker Data Model v1

This file and the SQL migrations are one contract. Update both in the same change.

## Portability categories

### Shared domain — exported in `.obtracker`

`workers`, `clients`, `projects`, `tasks`, `billing_terms`, `time_entries`.

These entities define the portable time-tracking domain that a future onBlank Central PostgreSQL module can consume. Central may add tenant/member/platform columns, but must preserve the semantics documented here.

### Desktop-only — never exported

`favorites`, `app_settings`, `backup_history`, `import_history`, `schema_migrations`, and the SQLite reference tables.

### Central-only — deliberately absent from OB-Tracker

Organizations/tenants, accounts/auth, memberships/RBAC, subscriptions, invoices/accounting, cloud synchronization, Central-side import mappings and other platform entities.

## Type mapping

| Concept | SQLite | PostgreSQL target |
|---|---|---|
| UUID | `TEXT` + app validation | `uuid` |
| Instant | canonical UTC ISO-8601 `TEXT` | `timestamptz` |
| Money | `INTEGER` minor units | `bigint` minor units |
| Enum | reference table / CHECK | enum/domain/check as Central prefers |
| Boolean | `INTEGER` 0/1 | `boolean` |

Money is never stored as floating point.

## Shared tables

### `workers`

One OB-Tracker installation has one functional worker, though the shared table itself remains portable.

| Column | Null | Meaning |
|---|---:|---|
| `id` | no | Stable UUID |
| `display_name` | no | Worker display name |
| `company_name` | yes | Optional company/studio name |
| `created_at` | no | Creation instant |
| `updated_at` | no | Last update instant |

No email, password or account identity belongs here.

### `clients`

| Column | Null | Meaning |
|---|---:|---|
| `id` | no | UUID |
| `name` | no | Client name |
| `description` | no | Plain text, empty allowed |
| `color_hex` | yes | UI color |
| `work_type` | no | `billable`, `non_billable`, `learning` |
| `created_at` | no | Creation instant |
| `updated_at` | no | Update instant |
| `archived_at` | yes | Archive instant |

Client work type is explicit. The app setting is only a creation default.

### `projects`

Projects always belong to a Client.

| Column | Null | Meaning |
|---|---:|---|
| `id` | no | UUID |
| `client_id` | no | FK Client |
| `name` | no | Project name |
| `description` | no | Plain text |
| `status` | no | `not_started`, `in_progress`, `completed` |
| `color_hex` | yes | UI color |
| `work_type_override` | yes | Null inherits Client |
| `estimated_seconds` | yes | Positive estimate |
| `budget_amount_minor` | yes | Monetary budget |
| `budget_currency_code` | yes | Required with monetary budget |
| `created_at` | no | Creation instant |
| `updated_at` | no | Update instant |
| `completed_at` | yes | Required exactly when completed |
| `archived_at` | yes | Archive instant |

Progress percentages are derived, never persisted.

### `tasks`

Tasks always belong to a Project.

Fields mirror Project where applicable: UUID, `project_id`, name, description, status, color, work-type override, estimate, optional monetary budget, creation/update/completion/archive timestamps.

Work type resolution is `Task override > Project override > Client explicit value`.

### `billing_terms`

Billing terms are effective-dated historical records. They are not overwritten when price terms change.

Exactly one of `client_id`, `project_id`, `task_id` is set.

| Column | Null | Meaning |
|---|---:|---|
| `id` | no | UUID |
| `client_id` | yes | Target Client |
| `project_id` | yes | Target Project |
| `task_id` | yes | Target Task |
| `billing_model` | no | `none`, `hourly`, `fixed` |
| `hourly_rate_minor` | yes | Required only for hourly |
| `fixed_amount_minor` | yes | Required only for fixed |
| `currency_code` | yes | Required for hourly/fixed |
| `effective_from` | no | Inclusive start instant |
| `effective_to` | yes | Exclusive end instant; null = current |
| `created_at` | no | Record creation instant |

Rules:
- Client cannot have `fixed`.
- Client can supply inherited `none`/`hourly` defaults.
- Project and Task may have fixed terms.
- At most one current term exists per entity.
- Terms for the same entity cannot overlap.
- A term is immutable except for closing its `effective_to` once.
- Historical terms cannot be deleted.

Billing resolution for a time entry is `Task > Project > Client > none`.

A Project fixed term is its base closed price. A child Task without an explicit term is included in that fixed price. A child Task with an explicit fixed/hourly term is additional scope. Explicit fixed zero is meaningful and distinct from inheritance.

Historical revisions for the *same* Project/Task are versions, not cumulative fixed charges.

### `time_entries`

A TimeEntry always references Worker + Client + Project; Task is optional. Tracking against Client alone is forbidden.

Core identity/context:
- `id`
- `worker_id`
- `client_id`
- `project_id`
- `task_id` nullable

Time/context:
- `started_at`
- `ended_at` nullable while active
- `started_timezone`
- `started_utc_offset_minutes`
- `ended_timezone` nullable while active
- `ended_utc_offset_minutes` nullable while active

User/audit context:
- `note`
- `source`: `timer` / `manual`
- `stop_reason`: `manual`, `switch_task`, `auto_stop`, `clock_change`, `idle_split`, `recovery`

Historical snapshots:
- `work_type_snapshot`
- `billing_model_snapshot`
- `billing_term_id_snapshot`
- `hourly_rate_minor_snapshot`
- `currency_code_snapshot`
- `rounding_mode_snapshot`
- `rounding_increment_minutes_snapshot`

Closed-entry calculations:
- `raw_duration_seconds`
- `rounded_duration_seconds`
- `calculated_amount_minor`

Metadata:
- `created_at`
- `updated_at`

An active entry has `ended_at IS NULL` and no closed-entry result fields. A closed entry has all closing/result fields populated.

`calculated_amount_minor` is the time-entry component only. Hourly entries may generate an amount. Fixed amounts remain in `billing_terms` and are never repeated per time entry.

Constraints/triggers enforce:
- one active time entry per Worker;
- no overlapping time intervals per Worker;
- Client/Project/Task hierarchy consistency.

Future-time and configured maximum-duration validation are application/domain rules because they depend on the current clock and local settings.

## Desktop-only tables

### `favorites`

Stores explicit local favorites. Exactly one Client, Project or Task target. Not exported.

### `app_settings`

Singleton row (`id = 1`) containing language, defaults, auto-stop, idle, rounding, date/time display, backup preferences, global shortcut and tray behavior. Not exported.

### `backup_history`

Records local `.sqlite` backup metadata. Not exported.

### `import_history`

Records successfully applied `.obtracker` export IDs and SHA-256 hashes to detect repeated imports. Not exported.

### `schema_migrations`

SQLite implementation metadata. Not exported.

## Deletion policy

Clients/Projects/Tasks are archived instead of destructively deleted once historical data references them. Shared historical data must remain resolvable.
