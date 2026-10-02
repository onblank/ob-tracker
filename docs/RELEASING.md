# Releasing OB-Tracker

## Versioning

SemVer with repository/product versioning: `0.x` during early development; `1.0.0` when product and interchange contracts are considered stable.

Use Conventional Commits. Release Please prepares version/changelog PRs.

Release automation authenticates through the organization-owned GitHub App configured with:

- Actions variable `ONBLANK_RELEASE_APP_ID`;
- Actions secret `ONBLANK_RELEASE_APP_PRIVATE_KEY`.

The app is installed only on repositories that use this release workflow. It needs repository
metadata read access plus Contents, Issues and Pull requests read/write access. It must not receive
administration access, approve pull requests, merge pull requests or bypass protected branches.

Never create or recreate a Release Please pull request manually. Its body contains machine-readable
release metadata that the action needs in order to create the tag and GitHub Release after merge.
Review the automated PR normally and merge it only after required CI succeeds.

## User-facing artifacts

Normal users must not need Node, pnpm, Git or `.env` files.

Official release pipeline targets:

- Windows x64: NSIS `.exe`
- macOS universal: `.dmg`
- Linux x64: `.AppImage` and `.deb`
- `SHA256SUMS`

GitHub Releases is the initial download surface. A future `onblanksystems.com/OpenSource` page can link to or mirror the same assets.

The Release workflow can also be dispatched manually with an existing `release_tag`. By default it
rebuilds that immutable tag. An optional `source_ref` may identify a later packaging-only correction;
the workflow rejects it unless the source package version still matches the release tag. This
recovery path uploads native assets for an already-created GitHub Release; it does not calculate a
version, move a tag or create a release PR.

## Signing

Development builds may be unsigned. Official releases should eventually use Windows code signing and macOS signing/notarization. Signing credentials live only in CI secret storage and are not required to run or develop the repository.

## Runtime updates

No automatic update/network client is included. Users choose when to download a new installer.
