---
title: "dynamodb/cellularization"
systemId: "dynamodb/cellularization"
dateRange: "2023"
standfirst: "Compute/storage segregation into isolated failure domains across US-EAST-1; extended AWS SDK Java v1/v2 for the new topology."
metrics:
  - label: "reliability"
    value: "+30%"
    source: "resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, -20% p99 latency)"
  - label: "p99 latency"
    value: "-20%"
    source: "resume-4.5 §AWS — DynamoDB cellularization (+30% reliability, -20% p99 latency)"
problem: "DynamoDB's compute and storage in US-EAST-1 shared failure domains, so a fault confined to one part of the fleet could blast-radius into unrelated tenants' capacity. The fix had to happen at the architecture level — isolating failure domains outright — not through better monitoring of the shared topology."
approach: "Segregated compute and storage into isolated cells, each its own failure domain, and extended the AWS SDK Java v1/v2 client libraries so requests could route against the new cellularized topology."
tradeoffs: "Cellular isolation trades blast-radius reduction against capacity-pooling efficiency: smaller failure domains contain incidents but fragment spare capacity that one shared pool could otherwise absorb. It also adds routing and placement complexity — deciding which cell serves which tenant, and how that assignment can move — and turns any migration into a sequencing problem, since cells have to be populated and cut over without violating the isolation guarantee mid-flight."
impact: "Up to +30% reliability and -20% p99 latency."
---

Full write-up above; frontmatter carries the structure and metrics for this entry.
