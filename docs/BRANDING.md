# Branding

## Canonical onBlank CSS palette

```css
--onblank-navy: #182332;
--onblank-blue: #5C6BFF;
--onblank-cloud-white: #F7F8FC;
--onblank-soft-blue-gray: #DCEBFF;
--onblank-graphite: #2D3645;
--onblank-signal-lime: #B8FFD8;
```

The supplied brand reference contains some RGB labels that do not numerically match the printed HEX values. The printed HEX values are canonical for this repository.

## Replace-in-place logo files

Place final artwork using these exact paths/names:

```text
apps/desktop/src/renderer/assets/brand/onblank-logo.svg
apps/desktop/src/renderer/assets/brand/powered-by-onblank.svg
apps/desktop/src/renderer/assets/brand/ob-tracker-logo.svg
```

Placeholder files are committed so the app works immediately. Components constrain rendered width/height and use `object-fit: contain`, so replacement artwork may have different intrinsic dimensions without changing layout code.

For release installer icons, add platform-native artwork later under `apps/desktop/build/`; packaging can then point to `.ico`/`.icns` assets without changing product identity.

Code licensing and trademark rights are separate; see `LICENSE` and `TRADEMARK.md`.
