# Deferred items — Phase 08

- [08-01] Legacy `--cdp`/`--moon` modes label their viewport by `--window-size`, but headless Chrome's effective viewport is smaller (1440,900 -> 1424x805 measured). The screenshot gate uses Emulation.setDeviceMetricsOverride and is exact; the analytic dev-loop tool still carries the mislabel. Fix candidate: add the same emulation call to cdpMain/moonMain (out of 08-01 scope — plan says keep existing modes fully intact; historical evidence docs reference the old numbers).
- [08-01] Chrome own-color ratios (--dim/--faint header/footer text, 1.7-3.1 vs own background) — design-tier dim text never gated on own color in project history; gate metric is vs --ink. If a future phase adopts own-color gating, these surfaces need a decision.
