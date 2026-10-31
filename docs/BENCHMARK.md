# Measured synthetic benchmark

Generated 2026-10-31T07:44:05.532Z. 180 fit incidents; 108 held-out incidents. Fit seeds 0, 1, 2, 3, 4, 5, 6, 7, 8, 9. Final test seeds 400, 401, 402, 403, 404, 405. Six scenarios × three stress levels.

| Investigator | Top-1 | Top-3 | Timeline τ | Onset error | Evidence P / R | Faithfulness | ECE | Brier | p50 / p95 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| ServiceShield | 81.5% | 100.0% | 0.964 | 48.0s | 83.3% / 5.3% | 100.0% | 0.055 | 0.188 | 20.5 / 37.9ms |
| Naive raw clocks (rules fallback) | 83.3% | 100.0% | 0.922 | 48.6s | 83.3% / 5.6% | 100.0% | 0.193 | 0.113 | 15.1 / 30.3ms |
| Rules without skew | 100.0% | 100.0% | 0.922 | 10.2s | 100.0% / 6.4% | 100.0% | 0.210 | 0.103 | 16.0 / 32.7ms |
| Ablation: no skew | 100.0% | 100.0% | 0.922 | 10.2s | 100.0% / 6.4% | 100.0% | 0.150 | 0.074 | 20.9 / 38.2ms |
| Ablation: no gap reasoning | 81.5% | 100.0% | 0.964 | 48.0s | 83.3% / 5.3% | 100.0% | 0.089 | 0.190 | 20.6 / 36.1ms |
| Ablation: no counterfactuals | 81.5% | 100.0% | 0.964 | 48.0s | 83.3% / 5.3% | 100.0% | 0.088 | 0.196 | 16.6 / 33.2ms |

Raw ECE **0.0704** → calibrated **0.0548**. **Measured ECE improvement.** Temperature 0.875. Fit-set ECE with a 0.0001 × mean NLL tie-breaker; no held-out seed used for parameter fitting.

ServiceShield abstained in 18.5% of cases; selective accuracy was 100.0%. Abstention counts as wrong for top-1. Both-fault recall was 97.2% averaged across all cases. Top-1 standard deviation across binary case outcomes was 38.8%. The no-skew baseline can achieve higher catalog top-1 coverage while producing a worse timeline. This is a disclosed limitation, not a claimed universal win.

Gap and twin ablations may show zero or negative gains on some metrics. Concise claim citations have low relevance recall; no-citation cases score zero precision/recall. Analyzer timing excludes generation, scoring, network, UI and provider latency. See [method](METHOD.md) for denominators and interval assumptions.

- All numbers are measured synthetic results, not production validation.
- Naive baseline uses a raw-clock earliest-change heuristic without an API key; no LLM baseline was called.
- Counterfactual intervals capture stochastic twin variation only.
- Top-1 accepts either true cause in an overlap; overlap recall measures both in top two.
- Ablations can have no gain or improve some metrics; no drops are manufactured.
- Claim faithfulness scores direct observations against the preserved record and causal inferences against scoring-only truth; unknown statements are explicitly bounded. Evidence P/R is over claim citations, excluding timeline context and rejected alternatives.
