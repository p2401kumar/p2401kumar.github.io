# 07-04 Task 3 — Visual Sign-Off (checkpoint auto-resolved under /gsd-autonomous)

**Status:** checkpoint auto-resolved under /gsd-autonomous with committed screenshot
evidence (async user veto available; live site unchanged until Phase 10 deploy gate).

Automated gates (contrast 4.58/12.22, moon dimness both widths, banding 4×2, blocking
LCP checkpoint 99–100 ×4 / LCP 1.9 s) had already passed before this judgment call —
this note records the craft-critical visual walkthrough against the committed evidence.

## Evidence reviewed

- 07-03 integration set: `integration-evidence/07-03-*.png` (6 files — DPR1 both widths,
  DPR2, true-375w mobile, reduced-motion, no-JS classic)
- Fresh 07-04 set (credit line + chrome fix live): `integration-evidence/07-04-*.png`
  (5 files — DPR1 1440×900 + 1280×800 full-page pair, DPR2 2880×1800, reduced-motion,
  no-JS classic scrolled to the footer)

## Walkthrough vs the checkpoint's how-to-verify

1. **Band-over-margin composition:** at both check widths the Milky-Way core sits in the
   RIGHT margin (core brightness x ≈ 0.85–1.0; content column fully dimmed by the baked
   vignette). Reads as "the same campsite on a clearer night" — camper, ground, header/
   footer, type all unchanged; only the sky upgraded.
2. **Bottom seam:** invisible at 1440×900, 1280×800, DPR2, reduced-motion, and no-JS
   classic — the baked 0.72/0.94 alpha ramp to `--bg` shows no banding or edge line where
   the photo hands off to the page background.
3. **Overlay harmony:** the drawn constellations (3.0/4.5 px + resting halo) and the
   crescent moon remain the largest, most deliberate points of light; the moon reads
   dimmer than the photo core (gate-asserted: 0.2123 < 0.4695 @1280, 0.1857 < 0.4748
   @1440 — physical-honesty story intact).
4. **Reduced-motion + classic:** static frame renders photo + moon + camper + credit
   line; no-JS classic bottom capture shows the photo behind in-flow sections and the
   2-line footer rendering normally.
5. **Footer:** credit renders as the footer's second line with working NOIRLab /
   CC BY 4.0 links; deck mode shows no occlusion after the 136 px panel-padding bump and
   the 24 px chrome-offset fix (view classic → status → credit stack cleanly; hint →
   index pill → clock likewise).

## Side-by-side note vs the v2 procedural look (explicit, for the async veto)

The v2 procedural band was a steep diagonal per 05-UI-SPEC (centerline x 0.63 → 0.87,
~24° from VERTICAL). The committed real-photo master instead carries the band as a
shallow ~20°-from-HORIZONTAL diagonal hugging the right margin — a broad wall of light
with the true galactic core at frame x ≈ 0.84–0.90. **This band-angle deviation from the
UI-SPEC's literal geometry is deliberate and was recorded at 07-01** (07-01-SUMMARY.md
deviation 3; 07-SPIKE-BANDING.md): the NOIRLab source is in galactic coordinates (band
horizontal), and forcing the literal 24°-from-vertical diagonal would need ~66° rotation
→ a 3.1× upscale with unacceptable softness. The 20° shallow diagonal was the
research-validated recipe and won the 3-candidate banding bake-off. Net effect: the sky
reads as an upgrade of the same composition language (bright band right, quiet left
margin, dark column) rather than a literal re-trace of the procedural centerline.

**Veto path:** re-grade/re-crop via `node scripts/build-sky.mjs` (crop candidates and
recipe documented in 07-SPIKE-BANDING.md) or adjust `object-position` in NightSky.astro,
then re-run the 07-04 battery. Nothing ships publicly before Phase 10's user-gated deploy.
