# OB-Tracker

**OB-Tracker** is the open-source, fully offline desktop time tracker by **onBlank**.

It is designed for Windows, macOS and Linux and stores all user data locally in SQLite.
There is no login, cloud account, telemetry, activation server, subscription check, or connection to
onBlank Central.

## Principles

- One installation represents one worker.
- SQLite is the local source of truth.
- The timer survives app restarts and computer shutdown logically from persisted timestamps.
- Maximum one active timer and no overlapping time entries.
- Default auto-stop: 24 hours.
- Default idle prompt threshold: 120 minutes.
- Billable / non-billable / learning is independent from hourly / fixed / none billing.
- Historical hourly billing values are snapshotted.
- `.obtracker` is the portable shared-domain format.
- `.sqlite` is the full local backup/restore format.
- OB-Tracker never connects to onBlank Central.

## Stack

- Electron 44.3.0
- React 19.3.0
- Vite 8.3.0
- TypeScript 5.9.3
- Tailwind CSS 4.3.3
- pnpm 12.4.1 + Turborepo 2.10.13
- SQLite + better-sqlite3 13.0.3
- Zod, i18next, date-fns, Recharts
- Vitest + Playwright
- electron-builder

TypeScript 7.0.2 is newer, but current typescript-eslint 8.70.0 officially supports TypeScript
`<6.1.0`, so this scaffold pins the newest stable compatible TypeScript 5.x release: 5.9.3.

## First run

The local onboarding asks only for a display name, optional company name, language/currency and basic work/billing defaults. It creates the single local Worker profile; no email, password or account is involved.

## Brand placeholders

Drop-in placeholder logos live under `apps/desktop/src/renderer/assets/brand/`. Replace the SVG contents using the same filenames when the official onBlank / Powered by onBlank / OB-Tracker assets are ready. Native placeholder icons live under `apps/desktop/build/`.

## Development

```bash
corepack enable
corepack prepare pnpm@12.4.1 --activate
pnpm install
pnpm dev
```

The first install generates `pnpm-lock.yaml`. Commit it immediately. No `.env` is required.

## Checks

```bash
pnpm check
```

## Native packages

```bash
pnpm package:win
pnpm package:mac
pnpm package:linux
```

Normal users do not need Node, pnpm, Git or environment variables. Public releases are intended to
provide `.exe`, `.dmg`, `.AppImage` and `.deb` downloads.

See `docs/RELEASING.md`.

## License

Source: Apache-2.0. Brand/trademark rights are separate; see `TRADEMARK.md`.
