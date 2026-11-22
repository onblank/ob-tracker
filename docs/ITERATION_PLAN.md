# OB-Tracker — First tracked session acceptance

The canonical delivery plan is [ROADMAP.md](../ROADMAP.md). This file preserves the original
acceptance record for roadmap iteration 1.1. The original iterations 2–5 are tracked as phases
2–5 in the roadmap, with native packaging and platform acceptance moved to phase 6.

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

## Verification policy

Every iteration is complete only when its acceptance criteria are exercised at the domain,
application/adapter and user-boundary levels appropriate to the change. Documentation must describe
only behavior that is actually implemented and verified.
