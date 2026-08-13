# Rio Canonical Asset Import Status

Status: DRAFT / RUNTIME PACK IMPORTED

This branch starts from the latest `main` after PR #2.

Imported and validated runtime assets:
- Base Master
- Hero
- Portrait
- Level Up
- Expressions: 8
- Chibi: 5
- `assets/trainers/rio/manifest.json`
- `docs/assets/rio/RIO_RUNTIME_REFERENCE_v1.png`
- `docs/assets/rio/CHARACTER_RIO_SOURCE.md`

Validation completed:
- Image dimensions match the runtime specification
- All images are sRGB with alpha
- Manifest paths, byte lengths and SHA-256 hashes match the imported binaries

The prior PR #3 is closed and will not be merged because it contains binary-storage experiments and was based on an older `main`.

This PR remains draft. MASTER_SPEC requires at least 10 expression states, while runtime pack v1 currently contains the approved 8-state set. Add or formally resolve the missing states before final merge review.
