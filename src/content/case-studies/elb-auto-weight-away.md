---
title: "elb/auto-weight-away"
systemId: "elb/auto-weight-away"
dateRange: "2023"
standfirst: "Load-balancer management that pre-allocates surge capacity and weighs out affected LBs — no human in the loop."
metrics:
  - label: "peak-hour latency"
    value: "-10%"
    source: "resume-4.5 §AWS — ELB auto-weight-away (-10% peak-hour latency, 90% capacity ops automated)"
  - label: "ops automated"
    value: "90%"
    source: "resume-4.5 §AWS — ELB auto-weight-away (-10% peak-hour latency, 90% capacity ops automated)"
problem: "Surge traffic could overload a load balancer faster than a human operator could react, and once an LB was affected, leaving it in rotation degraded every request routed behind it."
approach: "Built a load-balancer management service that pre-allocates dedicated capacity ahead of anticipated traffic and automatically weighs affected LBs out of rotation, with no human in the loop."
tradeoffs: "The weight-away pattern trades automation speed against false-positive weigh-outs: react fast enough to matter, and a transient blip risks pulling a healthy LB out of rotation unnecessarily. Pre-allocating dedicated capacity ahead of anticipated surges also costs idle headroom the rest of the time — a direct trade against surge readiness."
impact: "-10% peak-hour latency; 90% of capacity adjustments automated."
---

Full write-up above; frontmatter carries the structure and metrics for this entry.
