# Architecture

OB-Tracker is a local-first Electron desktop application using Clean Architecture.

```text
React renderer
     ↓ typed preload IPC
Electron main / composition root
     ↓
Application use cases
     ↓
Domain + ports/contracts
     ↑
SQLite / filesystem / OS adapters
```

## Packages

- `@obt/domain`: pure business policies/types.
- `@obt/application`: use cases/orchestration.
- `@obt/contracts`: ports/repository/read-model contracts.
- `@obt/db-sqlite`: SQLite migration/repository adapter.
- `@obt/import-export`: portable/native format validation and codecs.
- `@obt/settings`: typed local settings model.
- `@obt/ui`: reusable branded UI primitives.
- `@obt/shared`: tiny cross-boundary constants/primitives only.
- `@obt/test-utils`: test-only helpers.
- `@obt/desktop`: Electron, preload, React renderer and OS integration.

## Source of truth

SQLite is the local source of truth. Timer state is persisted; the renderer or Electron process is never authoritative for elapsed time.

## Network boundary

The installed application has no runtime network requirement. No auth, telemetry, remote fonts/assets, Central sync, remote update check or subscription validation.

Development tooling may download dependencies. Release downloads are distribution, not application runtime dependencies.
