# AGENTS.md — native packaging

Also read `../../AGENTS.md` and `../../../AGENTS.md`; both remain applicable to this subtree.

Packaging targets normal non-technical users. Runtime must remain offline and require no `.env`, Node, pnpm or Git.

Current targets:
- Windows x64 NSIS `.exe`
- macOS universal `.dmg`
- Linux x64 `.AppImage` + `.deb`

Do not commit signing certificates or secrets. Official signing/notarization credentials belong only in CI secrets.

Installer branding can be upgraded later by replacing platform-native build resources without changing app ID `com.onblanksystems.obtracker`.
