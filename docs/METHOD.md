# Method and assumptions

## Observation boundary

`Telemetry` is the investigator's entire input. It contains records, topology, workload and a declared clock reference. It never contains fault definitions, true event times, relevant-event labels or injected offsets. Simulation returns those labels separately; the API writes them to a different SQLite database through `scoring-store.ts`. Only post-report scoring reads that database. A static isolation test prevents investigator imports of generation, scoring, filesystem or database modules.

Records are sequenced in true emission order per service, then independent drops and arrival shuffling are applied. Sequence allocation includes metric/change streams. Original lines receive SHA-256 hashes before redaction. Redacted lines are rendered as React text and never interpreted as HTML. ISO timestamps, epoch milliseconds and explicit timezone offsets normalize to one event type. Invalid records fail ingestion instead of becoming fabricated events.

## Relative clocks and uncertainty

For each surviving causal call, forward timing gives an upper bound on the callee-minus-caller clock offset. The reverse leg gives the corresponding lower bound. The estimator intersects these difference constraints by shortest-path propagation from the declared gateway reference, and again on the reversed graph for lower bounds. A ±60-second prior bounds disconnected services.

Five 60-second-spaced window centers span the four-minute incident. Neighboring-window observations may contribute, with a 500-ppm distance allowance plus 120 ms slack. This conservative borrowing prevents a single lost response leg from creating a falsely precise clock estimate. The midpoints of feasible intervals form a piecewise-linear drift estimate. Every corrected time subtracts the full interpolated offset interval. The gateway itself retains a ±1 ms relative reference interval. Absolute UTC cannot be inferred from internal causal pairs.

Bounds assume a 1 ms minimum transport delay, drift within the configured 0–500 ppm range and a constant-plus-slow-drift clock. This is a bounded model, not arbitrary NTP-jump recovery. Sparse evidence can make intervals too broad to establish order. Tests measure offset recovery and event-time coverage; the benchmark reports actual ordering error.

## Correlation and gaps

Trace matches require the expected dependency. Without a shared trace, matching uses operation, peer, corrected interval proximity and remaining request hints; competing matches lower confidence. The event graph preserves those confidences. A missing edge is not invented as observed.

Sequence holes and caller sends without callee receipts create explicit unobserved intervals. Nearby heartbeat/metric liveness and surviving replies discriminate possible loss, down service and unestablished receipt. These labels are justified hypotheses. A synthetic lost log cannot always be distinguished from a request that never arrived. No missing content is reconstructed as a fact.

## Differential and intervention

The failure catalog covers pool saturation, bank unavailability, TLS expiry, blocked notification workers and memory leaks. Fault-specific observations, deploy/config changes and corroborated anomaly onsets supply support. Error-rate noise alone is insufficient to establish an onset without a nearby latency anomaly. Scores combine a prior and likelihood with unexplained-symptom, contradiction, time and topology penalties. Loss increases unknown mass and lowers evidence quality. Strong independent metrics remain informative when some logs are lost.

The raw mutually competing differential sums to one. Independent branches with their own direct fault signatures are also exposed as separate candidate findings, so overlapping faults are not silently collapsed into one cascade. Their marginal differential confidence is retained and is not a certified multi-label probability.

The twin accepts only a proposed fault, inferred independent background faults and the recorded workload. It compares observed per-service error/latency shape with modeled output, then removes the proposed fault. Eight seeds provide a Student-t interval on symptom reduction. This interval covers replay noise, not model mismatch. A similar reproduction can have multiple causes. Twin results alter the differential but never prove causation.

## Calibration and evaluation

Temperature is selected on fit incidents using ECE with a small mean-NLL tie-breaker. Fit seeds 0–9 cover all six scenarios and three stress levels (180 incidents). The final held-out seeds are 400–405 (108 incidents), disjoint from parameter fitting. Earlier development seeds are not the final reported set. The persisted calibrator is frozen before final scoring.

The reliability chart and Brier/ECE results are measured. If calibration does not improve ECE, the artifact and UI explicitly say so. A separate 60-incident clean fixture test checks that the implementation can improve held-out ECE; that does not guarantee improvement on every mixed-stress benchmark.

Top-1 treats abstention as incorrect, and either true fault is accepted in an overlap. Selective accuracy measures non-abstained diagnoses and must be read with abstention rate. Top-3 and both-fault recall are separate metrics. Kendall τ uses observed relevant-event order; simultaneous/sub-millisecond events can still introduce ties and rounding errors. Onset error is relative to the modeled physiological fault onset. For the memory scenario, the deploy happens 35 seconds before that onset, with further gradual symptom growth.

Evidence precision/recall is macro-averaged per case over report claim citations, against the simulator's full relevance set. A case with no citations has precision and recall zero. Concise reports cite a small subset, so recall is intentionally low and reported. Semantic faithfulness checks direct observations against actual preserved lines and causal inferences against post-run truth. Unknown statements remain explicitly limited. Timeline context and alternative hypotheses are excluded from that citation denominator.

The naive baseline orders raw logs and picks the earliest change/diagnostic using a deterministic heuristic when no LLM is enabled. With explicit `BENCHMARK_USE_LLM=true`, a configured Anthropic adapter can instead select from catalog hypotheses using only raw ordered evidence. No LLM baseline calls are claimed in the bundled results. The other baseline is rules without skew; ablations independently remove skew, gaps or counterfactuals. No metric drop is manufactured. Skew correction can improve ordering while reducing top-1 coverage through honest abstention. Gap reasoning and twins may not improve catalog accuracy in this small model.

Per-case benchmark time is analyzer wall time, excluding synthetic data generation, scoring, UI/network latency and optional provider latency. Report timing additionally covers the actual agent loop. Synthetic confidence, evidence labels and twin fidelity do not establish performance on real critical infrastructure.
