# Contributing to OB-Tracker

1. Read `AGENTS.md` and the nearest nested `AGENTS.md`.
2. Use Node 24 and pnpm 12.4.1.
3. Run `pnpm install`.
4. Run `pnpm check` before opening a pull request.
5. Use Conventional Commits.
6. Keep the runtime completely offline and never add Central synchronization.
7. Any shared schema change requires synchronized migrations, DATA_MODEL, EXPORT_FORMAT and tests.
