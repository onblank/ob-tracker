# Dependency Baseline

Versions are pinned exactly at repository generation time.

Core baseline:
- Node 24 LTS
- pnpm 12.4.1
- Electron 44.3.0
- React / React DOM 19.3.0
- Vite 8.3.0
- TypeScript 5.9.3
- Tailwind CSS 4.3.3
- better-sqlite3 13.0.3
- Zod 4.6.5
- Vitest 5.0.0
- Playwright 1.63.0
- electron-builder 26.15.3

TypeScript 5.9.3 is intentionally used instead of the newer npm TypeScript major because the pinned typescript-eslint baseline supports TypeScript `< 6.1.0` at generation time. Upgrade those together after compatibility is confirmed.
