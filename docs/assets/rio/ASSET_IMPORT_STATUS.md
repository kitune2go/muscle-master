# Rio Canonical Asset Import Status

Status: DRAFT / RUNTIME CONNECTED / QA PENDING

This branch starts from the latest `main` after PR #2.

## Imported runtime assets

- Base Master
- Hero
- Portrait
- Level Up
- Expressions: 8 approved face assets
- Chibi: 5 approved state assets
- `assets/trainers/rio/manifest.json`
- `docs/assets/rio/RIO_RUNTIME_REFERENCE_v1.png`
- `docs/assets/rio/CHARACTER_RIO_SOURCE.md`

Validation completed for the imported pack:
- Image dimensions match the runtime specification
- All images are sRGB with alpha
- Manifest paths, byte lengths and SHA-256 hashes match the imported binaries

## Expression-state decision

`00_MASTER_SPEC` defines ten minimum semantic states: 通常 / 笑顔 / 応援 / 称賛 / 驚き / 心配 / 疲労 / 休養 / 達成 / レベルアップ.
The approved production pack contains eight canonical face assets: `neutral / smile / cheer / blush / serious / tired / angry / achieved`.

For Runtime v1, the application uses a semantic state layer rather than requiring ten independent face files:

- 通常 → `neutral`
- 笑顔 → `smile`
- 応援 → `cheer`
- 称賛 → `achieved` fallback
- 驚き → `blush` fallback
- 心配 → `serious`
- 疲労 → `tired`
- 休養 → `chibi/rest`
- 達成 → `achieved`
- レベルアップ → dedicated `level-up.webp`

Dedicated praise and surprise face variants are deferred to Runtime v1.1. Their absence does not block v1 because every required UI state has an explicit runtime fallback.

## Application integration

Runtime integration is now present through:
- `trainer-data.js` — stable trainer ID, asset paths, semantic state mapping
- `trainer-runtime.js` — Home Hero, trainer-message state image and Level Up artwork binding
- `design-match.css` — Home Hero、Level Upを含むruntime presentation
- `sw.js` cache v9 — trainer runtime files and the Rio asset pack are available offline

The previous root-level `assets/rio-hero.webp` is no longer the Home runtime source on this branch; Home uses `assets/trainers/rio/hero.webp`.

The prior PR #3 is closed and will not be merged because it contains binary-storage experiments and was based on an older `main`.

Remaining gate before Ready for review: automated checks and Pages/mobile visual QA.
