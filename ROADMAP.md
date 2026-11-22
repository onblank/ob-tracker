# OB-Tracker — Development Roadmap

**Baseline:** `b00c718` on `dev`. **Next:** 2.1, manual time entries with validation.

## Objective

Let one local worker organize work, track time reliably and report time and calculated value on
Windows, macOS and Linux. SQLite is authoritative and the desktop works offline. A versioned
`.obtracker` file supports explicit interchange. Central's internal browser tracker is a separate
product boundary.

## How to maintain this roadmap

- `[x]` requires the stated behavior and relevant verification on `dev`. A phase closes when
  its iterations and exit criterion pass. Track packaging evidence separately from product flows.
- Start the first ready iteration unless the owner changes priority. In the same PR, add evidence
  and update **Next**. Use the branch and promotion flow in [AGENTS.md](AGENTS.md).
- [Domain rules](docs/DOMAIN_RULES.md), the [data model](docs/DATA_MODEL.md) and
  [file format](docs/EXPORT_FORMAT.md) define behavior. The
  [original iteration plan](docs/ITERATION_PLAN.md) preserves the first verified journey.

| Phase | Outcome                    | Status                                       |
| ----- | -------------------------- | -------------------------------------------- |
| 1     | First tracked session      | Verified                                     |
| 2     | Reliable daily tracking    | Open                                         |
| 3     | Work organization          | Open                                         |
| 4     | Billing and reporting      | Open                                         |
| 5     | Resilience and portability | Open                                         |
| 6     | Native release             | Release pipeline present, v1 acceptance open |

## [x] Phase 1 — First tracked session

- [x] **1.1 — Onboarding and persisted tracking.** From first launch, create a Client and Project,
      start one timer, restart, stop and see today's totals. The
      [acceptance record](docs/ITERATION_PLAN.md) reports verification on 2026-09-30 (`b33f15d`).

**Exit:** the app recovers the active timer from SQLite, and the closed entry retains its work,
billing and rounding snapshots.

## [ ] Phase 2 — Reliable daily tracking

- [ ] **2.1 — Manual entries and corrections.** Add a dated entry and edit notes or other permitted fields.
      Validate future times, durations and overlap against persisted entries, and preserve historical
      snapshots on safe edits.
- [ ] **2.2 — Timer switching and recovery.** Stop the current timer and start another explicitly.
      Verify single-timer invariants, max-duration recovery, app restarts and system clock changes.
- [ ] **2.3 — Daily history.** Navigate dates and verify displayed entries and totals for local
      day boundaries and rounding. Exercise empty/error states and refresh after changes.

**Exit:** a worker can reconcile a day's manual and timed work after a restart without overlapping
entries or distorted totals.

## [ ] Phase 3 — Work organization

- [ ] **3.1 — Client, Project and Task lifecycle.** Add editing, archiving and reopening with
      valid status transitions. Track against optional Tasks while retaining Client and Project
      references. Verify historical entries remain readable after archive.
- [ ] **3.2 — Work planning and discovery.** Add estimates, budgets, favorites, recents and
      hierarchy search/filters. Verify selections and reported actuals when items are completed or
      archived.

**Exit:** a worker can organize active work, resume the right task and find archived history.

## [ ] Phase 4 — Billing and reporting

- [ ] **4.1 — Effective-dated billing.** Manage inherited work types and Client/Project/Task
      billing terms. Preview the resolved terms and verify that subsequent edits leave older
      snapshots intact.
- [ ] **4.2 — Reports and CSV.** Verify daily/weekly/monthly totals, raw and rounded durations,
      calculated hourly and fixed contract values against representative records. Keep these values
      distinct from recognized revenue. Export generic CSV
      and check its totals against the same report selection.

**Exit:** the same historical input reproducibly yields the same operational report and export.

## [ ] Phase 5 — Desktop resilience and portability

- [ ] **5.1 — Idle and desktop controls.** Route idle resolution, tray actions and shortcuts
      through the same persisted timer rules. Verify user choices and surface registration failures.
- [ ] **5.2 — Local backup and restore.** Verify versioned, consistent SQLite backups, reminders,
      retention and recovery after interrupted writes. Restore into an isolated profile and compare key records.
- [ ] **5.3 — Portable interchange.** Exercise version/hash validation and transactional
      `.obtracker` import/export, including damaged files and conflicts. Confirm that local settings
      stay out of interchange and incompatible input leaves existing records intact.

**Exit:** a worker can recover or move their records explicitly and continue tracking offline.

## [ ] Phase 6 — Native release

- [x] **6.1 — Packaging baseline.** The [release workflow](docs/RELEASING.md) defines NSIS, DMG,
      AppImage/Debian packages, checksums and an existing-tag recovery path. Packaging corrections
      landed through `b00c718`; native product-flow acceptance is tracked in 6.2.
- [ ] **6.2 — Native acceptance.** Install and upgrade on all three platforms, preserve local
      data and exercise tracking, tray, recovery and interchange from the installed app.
- [ ] **6.3 — Publish v1.** Review installer trust/signing status, verify downloadable assets and
      recovery instructions, and record owner approval once the product and interchange contracts
      are stable.

**Exit:** a validated v1 installer runs the required offline flows without a development toolchain.
