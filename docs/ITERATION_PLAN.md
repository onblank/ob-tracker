# OB-Tracker Iteration Plan

This plan turns the existing offline desktop foundation into a usable product through small vertical
slices. Each iteration must preserve the Clean Architecture boundaries, SQLite as the local source of
truth, the one-worker model and the prohibition on runtime network access.

## Iteration 1 — First tracked session

Status: complete and verified on 2026-09-30.

User outcome:

```text
Complete onboarding
→ create a Client
→ create a Project
→ start a persisted timer
→ restart the application without losing the active timer
→ stop the timer
→ see the entry and today's totals
```

Scope:

- Create and list active Clients using the onboarding work/billing defaults.
- Create and list active Projects under a Client.
- Start and stop one persisted timer against Client + Project.
- Move a `not_started` Project to `in_progress` on first tracking.
- Recover active state from SQLite after application restart.
- Show completed entries and work-type totals for the current local day.
- Cover domain calculations, application orchestration, SQLite repositories and typed IPC.

Deliberately deferred: editing/archiving, Tasks, manual entries, timer switching, idle handling,
automatic stop, billing-term editing, reports, import/export, backups and settings management.

Acceptance criteria:

- No timer can start without an active Client and Project.
- A completed Project cannot be tracked without an explicit future reopen flow.
- At most one active timer exists for the local Worker.
- Starting and stopping are persisted immediately; renderer state is never authoritative.
- Closed entries retain work type, billing and rounding snapshots.
- `pnpm check` passes and the happy path is covered by automated tests.

## Iteration 2 — Reliable daily time management

- Add manual time entries with future, duration and overlap validation.
- Edit notes and safe fields on closed entries without changing factual history.
- Implement timer recovery auto-stop and the configured maximum duration.
- Add explicit stop-current-and-start behavior.
- Add daily navigation and useful empty/error states.

## Iteration 3 — Tasks and work organization

- Create, edit, archive and reopen Clients, Projects and Tasks.
- Track optionally against a Task while always retaining Client + Project.
- Implement status transitions, estimates, budgets, favorites and recents.
- Add direct filtering/search across the hierarchy.

## Iteration 4 — Billing and reporting

- Manage effective-dated billing terms for Clients, Projects and Tasks.
- Surface inherited work type and billing resolution before tracking.
- Add daily/weekly/monthly reports with raw and rounded durations.
- Report hourly calculated value and fixed contract value without accounting revenue recognition.
- Export generic CSV reports.

## Iteration 5 — Desktop resilience and portability

- Implement idle detection and explicit idle-resolution flows.
- Add safe SQLite backup, restore, reminders and retention.
- Implement validate-first transactional `.obtracker` import/export.
- Complete tray/global-shortcut behavior and surface registration failures.
- Add native-package smoke coverage for Windows, macOS and Linux.

## Verification policy

Every iteration is complete only when its acceptance criteria are exercised at the domain,
application/adapter and user-boundary levels appropriate to the change. Documentation must describe
only behavior that is actually implemented and verified.
