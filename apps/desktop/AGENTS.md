# AGENTS.md — apps/desktop

Also read `../../AGENTS.md` and `../../../AGENTS.md`; both remain applicable to this subtree.

Scope: Electron shell, preload bridge, renderer UI and OS integrations.

## Non-negotiable boundaries

- Runtime network access is forbidden. Do not add Central clients, HTTP sync, telemetry, remote assets or online activation.
- Renderer never opens SQLite or the filesystem directly.
- Renderer has `nodeIntegration: false`; use the narrow typed preload API.
- Main process composes application use cases and infrastructure adapters; it does not own business rules.
- Persist timer state immediately. Never use an in-memory stopwatch as the source of truth.
- All brand assets are local.

## Renderer

React + TypeScript + Vite + Tailwind.

Feature folders may own UI state and presentation, but domain decisions belong in `@obt/domain` and orchestration in `@obt/application`.

Navigation areas:
- Dashboard
- Timer
- Time Entries
- Clients
- Projects
- Tasks
- Reports
- Import / Export
- Backups
- Settings
- About

The Client → Project → Task relationship is a data hierarchy, not a navigation restriction. Global search/filtering must allow direct access.

## Electron security

Required:
- `contextIsolation: true`
- `nodeIntegration: false`
- sandboxed renderer where compatible
- payload validation at IPC boundaries
- no unrestricted `ipcRenderer`, `fs`, shell or database handles exposed to renderer

## OS integration

Support Windows, macOS and Linux for:
- tray/menu-bar controls
- configurable global shortcut
- idle detection
- app data paths
- packaging

Default global shortcut: `CommandOrControl+Shift+T`. Registration failure must be surfaced rather than overriding a conflict.

Closing the main window hides to tray when configured. Explicit Quit exits the process; a persisted active timer remains logically active and is recovered/auto-stopped on next start.

## Branding assets

Canonical replace-in-place files:
- `src/renderer/assets/brand/onblank-logo.svg`
- `src/renderer/assets/brand/powered-by-onblank.svg`
- `src/renderer/assets/brand/ob-tracker-logo.svg`

UI containers must force intended display dimensions and `object-fit: contain`; never depend on source-image pixel dimensions.
