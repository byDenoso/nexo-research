# Changelog

## DESI × eROSITA observatory

- The PT and EN homepages open with fixed WebP views of the same observed coordinates used by the native WebGL2 observatory. The incoming package contained only the HTML prototype, so the WebP was rendered from the observations using its initial 60° camera elevation and stored yaw. The 48° value in the original metadata describes a separate reference projection.
- The 143,633 DESI DR1 and 941 eROSITA eRASS1 records are byte-identical to the supplied float32 payloads. The manifest retains the input HTML, source catalogue, payload and poster hashes. The displayed region is 0.1 ≤ z ≤ 0.4 and −10° ≤ declination ≤ +10°. Distances are comoving in flat ΛCDM with H₀ = 70 km/s/Mpc and Ωₘ = 0.3. The display combines different survey selections without cross-matching or reconstructing matter density.
- Activating the map loads and checks the catalogue payloads before GPU upload. Camera controls support keyboard, mouse, touch and pinch. Redshift and visibility are independent of the camera, and displayed counts include object centres in the frame. Rotation suspends offscreen and is opt-in under reduced motion. The static view remains available without WebGL2.
- Shared interface motion adds hover and keyboard feedback to controls and one-time section entries below the first viewport, using CSS transforms and a single intersection observer. It respects reduced-motion preferences and does not hide text before entry.
- The original Pantheon+ plate is available under **Data & Methods**, alongside the existing Pantheon+ atlas and download routes. Results, evidence states and data snapshots are unchanged.

Reproduce the derived browser assets with `python scripts/import-observatory.py /path/to/nexo_desi_erosita_3d.html` (NumPy, SciPy and Pillow).
