# DESI × eROSITA observatory — 2026-11-24

- Reuses the existing observatory pull request; the catalogue binary blobs and original poster are unchanged.
- Home in PT/EN: native WebGL point rendering, controls, keyboard/touch, PNG, fullscreen, redshift and layer counts, scientific attribution. Pantheon+ remains on the data page.
- Projection: original poster at 48°; initial interactive pitch at 60°, matching provenance. No inferred objects or associations.
- Performance follow-up: consolidate CSS entry points while retaining cascade; avoid optional font preload; adaptive render resolution, suspend animation in hidden tabs, verify payload SHA-256 where SubtleCrypto is available; context-loss fallback.
- Add observed WebGL renderer and readPixels evidence, and an independently checked redshift interval (45,485 + 309 at 0.20–0.30).
- Baseline CI #79: 50 unit / 270 end-to-end passes; Lighthouse mobile LCP PT 2808.8908 ms, EN 2565.6116 ms; accessibility 100 both. Gate unchanged: LCP <2500 ms.
- Release remains conditional on the complete CI and production verification. Software WebGL does not establish physical-GPU performance.
