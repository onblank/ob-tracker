# AGENTS.md — OB-Tracker master instructions

## Product
- Product: OB-Tracker
- Brand: onBlank / onBlank Systems
- Repository: `ob-tracker`
- Application ID: `com.onblanksystems.obtracker`
- Packages: `@obt/*`
- License: Apache-2.0
- Platforms: Windows, macOS, Linux

Read the closest nested `AGENTS.md` too.

## Runtime boundary: OFFLINE

Never add runtime requirements for accounts, authentication, remote APIs, cloud services, telemetry,
remote feature flags, remote assets, subscription checks or onBlank Central.

Development/package downloads may use the internet. The installed product must not need it.

## Central prohibition

OB-Tracker MUST NEVER synchronize or communicate directly with onBlank Central. Forbidden:
Central API clients, OAuth, tokens, websocket sync, background upload, remote DB access and
“Connect to Central” flows.

The only interoperability boundary is a versioned local `.obtracker` file.

## One worker

One installation represents one worker. The portable worker has stable UUID, `display_name`,
nullable `company_name`, `created_at`, `updated_at`. No email/password/account fields.

## Architecture

Use Clean Architecture:

```text
Electron/React -> Application -> Domain
                     |
                  Contracts
                     ^
         SQLite / OS / filesystem adapters
```

Business rules do not live in React, IPC handlers or raw SQL.

## Hierarchy

Client -> Project -> Task.
Project requires Client. Task requires Project.
A time entry requires Client + Project; Task is optional.
Tracking only against Client is forbidden.
Archived hierarchy cannot start timers.

## Project/task status

`not_started`, `in_progress`, `completed`.
First tracking moves applicable not-started Task/Project to `in_progress`.
Never auto-complete. Reopening completed work is explicit.

Projects/Tasks have descriptions, colors, created/updated/completed/archived timestamps.

## Work type

`billable`, `non_billable`, `learning`.
Resolution: Task override > Project override > Client.
Client always stores an explicit work type.

## Billing

Separate from work type.
Models: `none`, `hourly`, `fixed`.
Resolution for a time entry: Task term > Project term > Client term > none.
Client may use none/hourly, never fixed. Project/Task may use fixed.

Project fixed is its base closed price. Child Tasks without explicit billing are included. Explicit
child fixed/hourly terms are additional scope; explicit fixed 0 means zero extra. Historical revisions
of the same entity are not cumulative fixed charges.

OB-Tracker reports fixed contract/billable value but does not perform accounting revenue recognition.

## Money

Integer minor units only. Never FLOAT/REAL.
Use uppercase three-letter currency codes.

## Timers

Max active per worker: 1. Overlaps: forbidden.
Starting another timer offers stop-current-and-start or cancel.
Active state is persisted immediately (`ended_at IS NULL`).

Default auto-stop: 24h configurable. On recovery, close at `started_at + limit`, not restart time.

## Manual entries

Reject zero, negative, future, end<=start, overlaps and entries beyond configured auto-stop duration.

## Clock manipulation

While running, compare wall clock with a monotonic clock. Material drift closes active tracking with
`clock_change` using last trusted time. Timezone changes alone do not count as clock manipulation.
After shutdown, tamper detection is best-effort because there is intentionally no remote trusted clock.

## Idle

Default 120 minutes. Never silently delete time. User resolves idle. Removing an idle gap while
continuing creates separate contiguous entries. Auto-stop wins.

## Rounding

Raw duration stays factual. Billing rounding: none/nearest/up/down, increments 1/5/6/10/15/30/60 min.
Snapshot applicable rule on closed entries.

## Snapshots

Closed hourly entries snapshot effective work type/model/term/rate/currency/rounding, raw and rounded
duration and calculated amount. Later changes must not alter historical value. Fixed amounts live in
billing terms, not repeated on each entry.

## Estimates/budgets

Projects/Tasks may store estimated seconds and monetary budget minor units + currency. Percentages are derived.

## Archive

Prefer archival over destructive deletion. Historical references stay valid.

## Favorites/recents

Favorites are local-only. Recents derive from time entries; avoid redundant recency state.

## Files

- `.sqlite`: full local backup/restore
- `.obtracker`: portable shared-domain transfer
- generic CSV: human/spreadsheet reporting

Weekly backup reminder 7 days, retention 5 by default.

## Shared/exported

`workers`, `clients`, `projects`, `tasks`, `billing_terms`, `time_entries`.

## Local-only/not exported

`favorites`, `app_settings`, `backup_history`, `import_history`, `schema_migrations`.

## Central-only — never add here merely for future needs

organizations/tenants, accounts/auth, memberships/RBAC, subscriptions, invoices/accounting, cloud sync,
Central import mappings.

## SQLite

better-sqlite3, no ORM, explicit SQL migrations, raw SQL only under `packages/db-sqlite`.
SQLite has no PostgreSQL schemas/domains/enums/stored PL/pgSQL functions. `001_initials.sql` holds
reference/type-like tables. `002_functions.sql` intentionally reserves the normal onBlank functions slot and is a no-op in SQLite; custom SQLite functions live in TypeScript. Feature migrations hold tables/indexes/triggers.

## Native import

Export every shared field; no local-only dependency may be required. Import is validate-first,
transactional, identical-ID idempotent, and conflicting same-ID data aborts v1 import.

## Electron security

`contextIsolation: true`, `nodeIntegration: false`, sandbox renderer where compatible, narrow typed
preload, validate IPC input, renderer never opens SQLite/filesystem directly.

## Brand palette

Canonical HEX:
- Navy #182332
- Blue #5C6BFF
- Cloud White #F7F8FC
- Soft Blue Gray #DCEBFF
- Graphite #2D3645
- Signal Lime #B8FFD8

The provided reference has inconsistent RGB text for some colors; treat printed HEX values as canonical.

## Toolchain

Node 24, pnpm 12.4.1, Electron 44.3.0, React 19.3.0, Vite 8.3.0, TypeScript 5.9.3,
Tailwind 4.3.3, better-sqlite3 13.0.3, Vitest 5.0.0, Playwright 1.63.0,
electron-builder 26.15.3. Pin exact versions.

## Environment

No `.env` required. App settings live in SQLite/static config. Signing secrets only in CI.

## Distribution

Normal users must get native downloads (.exe/.dmg/.AppImage/.deb) without development knowledge.
GitHub Releases first; future onblanksystems.com/OpenSource can link or mirror them.

## Agent workflow

Domain rule -> tests -> application use case/ports -> adapter -> Electron/UI last.
Update docs/schema/export contract together. Never bypass layers.
