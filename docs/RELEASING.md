# Releasing OB-Tracker

## Versioning

SemVer with repository/product versioning: `0.x` during early development; `1.0.0` when product and interchange contracts are considered stable.

Use Conventional Commits. Release Please prepares version/changelog PRs.

## User-facing artifacts

Normal users must not need Node, pnpm, Git or `.env` files.

Official release pipeline targets:
- Windows x64: NSIS `.exe`
- macOS universal: `.dmg`
- Linux x64: `.AppImage` and `.deb`
- `SHA256SUMS`

GitHub Releases is the initial download surface. A future `onblanksystems.com/OpenSource` page can link to or mirror the same assets.

## Signing

Development builds may be unsigned. Official releases should eventually use Windows code signing and macOS signing/notarization. Signing credentials live only in CI secret storage and are not required to run or develop the repository.

## Runtime updates

No automatic update/network client is included. Users choose when to download a new installer.
