# Grafana Dashboards for Inject Quality

These dashboards are core signals for Content Scope Scripts quality and rollout health across clients.

## 1) Broken Site Reports

- Dashboard: [Broken Site Reports](https://grafana.duckduckgo.com/d/cevgqetpaiz28c/f09f9294-broken-site-reports?orgId=1)
- Scope: All site breakage reports.
- Use it to:
    - Detect regressions and spikes in breakage volume.
    - Identify impacted sites and platforms quickly.
    - Prioritize high-impact breakage clusters.

## 2) Site breakage in experiments

- Dashboard: [Site breakage in experiments](https://grafana.duckduckgo.com/d/ferlqqjld3y0wc/site-breakage-in-experiments?orgId=1)
- Scope: User segmentation to diagnose breakage in experiments.
- Use it to:
    - Compare breakage behavior across cohorts.
    - Validate whether a variant is causing regressions.
    - Estimate blast radius before broader rollout.

## 3) Submodule Version Tracker

- Dashboard: [Submodule Version Tracker](https://grafana.duckduckgo.com/d/hfxuXf5Nz/submodule-version-tracker)
- Scope: Rollout tracking of current Content Scope Scripts versions across clients.
- Use it to:
    - Correlate breakage shifts with rollout windows.
    - Confirm which clients have picked up a version.
    - Determine whether an issue is pre-rollout or post-rollout.

## Recommended triage sequence

1. Start with **Broken Site Reports** to detect spikes or breakage clusters.
2. Check **Submodule Version Tracker** over the same time range to find rollout correlation.
3. Use **Site breakage in experiments** to verify whether the issue is cohort-specific.
4. If cohort-specific, adjust experiment exposure; if version-correlated, triage C-S-S changes and rollout timing.

Keep time windows and platform filters aligned across all three dashboards to avoid false attribution.
