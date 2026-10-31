# ServiceShield · requirements map

The problem statement is implemented as a synthetic, runnable research system. Measured limitations and unsupported external connections are explicitly disclosed. Ground truth is available only to post-run scoring, never to the investigator.

| Exact phrase | Visible feature | Exact implementation | Verification |
|---|---|---|---|
| “09 Autonomous Incident Investigation for Critical Public Services” | Autonomous case creation, investigation, report and review for benefits/health services | `packages/investigator/src/agent.ts::investigate`; `apps/api/src/app.ts::run`; `/lab` | `tests/report.test.ts` fallback plan; `tests/api.test.ts` full case flow; Playwright judge journey |
| “reconstructs a cross-service failure timeline” | Timeline combines observed causes, first symptoms, service clocks and explicit gaps | `packages/investigator/src/analyze.ts`; `apps/web/src/components.tsx::Timeline`; `apps/web/src/CasePage.tsx` | `tests/skew.test.ts`; `tests/correlation.test.ts`; measured Kendall τ in benchmark |
| “despite incomplete logs” | Sequence loss, burst loss, caller/callee silence and visible unobserved markers | `packages/simulator/src/index.ts::simulate`; `packages/investigator/src/correlate.ts::findGaps` / `gapEvents` | `tests/correlation.test.ts` correlation under 35% loss and full trace drop |
| “and clock skew” | Difference constraints, graph propagation, windowed drift estimates, uncertainty intervals; raw/corrected switch | `packages/investigator/src/skew.ts::estimateSkew` / `correctClocks` | `tests/skew.test.ts` 12 seeds, 30-second skew, drift, interval coverage and sparse widening |
| “ranks root-cause hypotheses” | Differential with prior × likelihood, four penalty types, evidence and explicit unknown | `packages/investigator/src/hypotheses.ts::rankHypotheses` | `tests/hypotheses.test.ts` fixture rankings, normalization and evidence degradation |
| “tests them counterfactually” | Reproduction and cure over eight seeded twin replays, verdict, replay CI, curve overlay | `packages/investigator/src/counterfactual.ts::testCounterfactual`; `apps/web/src/Charts.tsx` | `tests/counterfactual.test.ts` supported/refuted/inconclusive thresholds and compatible cure; Playwright intervention |
| “Reports must separate facts from inferences” | FACT solid underline, INFERENCE dashed underline, UNKNOWN hatched and text-labeled | `packages/investigator/src/report.ts::ReportSchema` / `validateReport`; `apps/web/src/CasePage.tsx` | `tests/report.test.ts` causal statement mislabeled FACT rejected |
| “link claims to evidence” | Stable IDs, raw source/line, original hash, corrected interval, click-through provenance drawer | `packages/investigator/src/ingest.ts`; `packages/investigator/src/report.ts`; `apps/web/src/components.tsx::EvidenceDrawer` | `tests/report.test.ts` invented IDs and provenance verification; Playwright drawer |
| “with calibrated confidence” | Persisted temperature model fitted on at least 60 incidents; raw and calibrated values, Brier, ECE and reliability diagram | `packages/investigator/src/calibration.ts`; `data/calibrator.json`; `/benchmark` | `tests/calibration.test.ts` held-out fixture improvement; `tests/benchmark.test.ts` full-mix honest outcome |
| “cross-service correlation” | Trace links, otherwise corrected-time/operation/request-hint matches with ambiguity penalty | `packages/investigator/src/correlate.ts::correlate`; Timeline causal-link table | `tests/correlation.test.ts` no-trace probabilistic linking |
| “clock-skew correction” | Bellman-Ford shortest-path bounds in both directions, conservative drift allowance and piecewise interpolation | `packages/investigator/src/skew.ts` | `tests/skew.test.ts` recovery, coverage and widening |
| “causal analysis” | Declared topology, cause-before-effect interval checks, independent-branch findings, interventional twin | `packages/investigator/src/hypotheses.ts`; `packages/investigator/src/counterfactual.ts`; report `independent_faults` | `tests/scenarios.test.ts` overlap separation; `tests/counterfactual.test.ts` |
| “missing-data reasoning” | “log loss”, “service down”, “never received” classifications with liveness justification | `packages/investigator/src/correlate.ts::classifyGap` / `findGaps` | `tests/correlation.test.ts` all three classifications |
| “evidence provenance” | Synthetic source paths, sequence line numbers, original SHA-256, redacted immutable observations | `packages/investigator/src/ingest.ts`; `packages/investigator/src/report.ts::validateReport` | `tests/report.test.ts`; `tests/skew.test.ts` PII redaction |
| “confidence calibration” | Fit-set ECE with tiny NLL tie-breaker; frozen model before unseen test seeds; no result fabricated if ECE worsens | `packages/investigator/src/calibration.ts::fitTemperature`; `scripts/benchmark.ts::runBenchmark` | `tests/calibration.test.ts`; `tests/benchmark.test.ts` seed separation and outcome consistency |
| “root-cause and timeline accuracy” | Top-1/top-3, abstention/selective accuracy, Kendall τ, onset error, both-fault recall | `scripts/benchmark.ts::score`; `scripts/scoring.ts`; `data/benchmark.json` | `tests/scoring.test.ts`; `tests/scenarios.test.ts`; `npm run benchmark` |
| “investigation time” | Per-case analyzer wall time and p50/p95; report also records agent wall time | `packages/investigator/src/analyze.ts`; `packages/investigator/src/agent.ts`; `scripts/benchmark.ts::summarize` | API integration saves timing; benchmark validates finite times |
| “evidence quality” | Macro precision/recall over claim citations versus scoring-only relevant records; semantic claim faithfulness | `scripts/benchmark.ts::score`; `scripts/scoring.ts::evidenceScore` | `tests/scoring.test.ts` irrelevant evidence penalty; report validator and benchmark tests |
| “confidence calibration” (success metric) | Raw/calibrated Brier and ECE, reliability bins, honest improvement flag | `packages/investigator/src/calibration.ts::ece` / `brier` / `reliability`; `/benchmark` | `tests/calibration.test.ts`; `tests/benchmark.test.ts` |
| “Observability” | Every agent action and audit entry; optional investigation trace with stage spans and token metadata | `packages/investigator/src/agent.ts`; `apps/api/src/adapters/langfuse.ts`; Report trace replay | `tests/report.test.ts`; `tests/integrations.test.ts` offline trace fallback |
| “AI Agents” | Validated tool planner, dependency-aware tool selection, gather/revise/budget/stop loop and deterministic fallback | `packages/investigator/src/agent.ts`; `apps/api/src/adapters/anthropic.ts` | `tests/report.test.ts` invalid tool/citation fallback and budget exhaustion |
| “SDG 9, 16” | Resilient infrastructure and accountable institutions, public summary and human publication gate | `apps/web/src/Pages.tsx::About`; `packages/investigator/src/report.ts`; API approval/publish routes | `tests/api.test.ts` approval before publish; `tests/integrations.test.ts` automation cannot approve |


# Reconstruct the failure. Show the evidence. Admit what is unknown.

ServiceShield is an autonomous investigator for synthetic citizen-benefits and health-appointment outages. It reconstructs uncertain time, compares causes, challenges them in a digital twin, and writes a technical report plus a plain-language public summary. A Reviewer must approve publication.

The complete [requirements map](docs/REQUIREMENTS_MAP.md), [measured benchmark](docs/BENCHMARK.md), [method and limitations](docs/METHOD.md), [three-minute demo](docs/DEMO_SCRIPT.md), and [integration verification](docs/INTEGRATIONS.md) are part of the deliverable. No slides are included.

## Run in under ten minutes

With Docker and Compose installed:

~~~sh
docker compose up --build
~~~

Open **http://localhost:8080**, go to Login, and choose **Enter as judge**. n8n is at **http://localhost:5678**. The API seeds six investigated cases and generates benchmark/calibration artifacts if missing. First image/package downloads depend on network speed. No API keys are required for the local demonstration. Ports bind to localhost; judge mode is deliberately enabled for this synthetic demo.

For local development with Node.js 22+:

~~~sh
npm ci
cp .env.example .env
npm run benchmark
npm run seed
npm run dev
~~~

Open **http://localhost:5173**. PowerShell supports the same copy command via its alias. On this provided Windows workspace, Node and Git were absent from PATH; a portable Node runtime was installed in ignored '.tools'. **'.\dev.cmd' starts this workspace directly.** The full portable equivalent of any npm command is:

~~~powershell
.\.tools\node\node.exe scripts\run-local.cjs .tools\node\node_modules\npm\bin\npm-cli.js run dev
~~~

The repository uses standard npm workspaces; portable tools are not required on a normal Node installation and are excluded from source control and Docker context. 'npm run seed' refreshes only the six named fixture cases and preserves other generated cases and prior audit entries.

## Architecture

~~~mermaid
flowchart LR
  Web[React operator workspace] -->|session + REST / SSE| API[Express API]
  API --> Cases[(Cases / sessions / audit SQLite)]
  Sim[Seeded simulator] -->|Telemetry only| Agent[Pure investigator agent]
  Sim -->|Separate scoring labels| Truth[(Scoring-only SQLite)]
  API --> Agent
  Agent --> Clocks[Clock bounds + causal graph + gaps]
  Clocks --> Differential[Bayesian-style differential]
  Differential --> Twin[Reproduction + cure twin]
  Twin --> Cal[Persisted temperature calibrator]
  Cal --> Report[Evidence-validated technical + public reports]
  Report --> Human[Reviewer approval]
  Human --> Publish[Published public summary]
  API -. signed callbacks .-> N8N[n8n automation + waiting workflow]
  Agent -. optional validated planner .-> Claude[Anthropic]
  API -. optional stage spans .-> Trace[Langfuse]
  Truth -->|after report only| Scoring[Benchmark / accuracy badge]
~~~

Six internal services plus the external bank adapter resolve the brief's six-services-versus-seven-names ambiguity. Ground truth is stored in a different database and never enters an investigator function. The engine imports behavior models and types only; an isolation test guards that boundary. Public telemetry is entirely synthetic.

## Commands

| Command | Result |
|---|---|
| 'npm run dev' | API on 3001 and Vite on 5173; same-origin API proxy |
| 'npm run seed' | Six reproducible, investigated fixture cases |
| 'npm run benchmark' | 180 fit incidents, 108 final held-out incidents; baselines, ablations, calibrator and docs |
| 'npm run build' | Type check, production bundles, pre-rendered landing, sitemap and robots |
| 'npm test' | Unit and authenticated API integration suite |
| 'npx playwright install chromium' | Browser for the acceptance test, if not already installed |
| 'npm run test:e2e' | Judge login → stressed lab run → provenance drawer → counterfactual |
| 'npm start' | API only; use Vite for local web or Compose for full deployment |

For installed Chrome instead of downloaded Playwright Chromium, set 'CHROME_PATH' to its executable. Set 'E2E_EXTERNAL_SERVER=true' when a dev server is already running. For Docker E2E use 'E2E_BASE_URL=http://localhost:8080' with an external server. Docker was unavailable on the build host; native build, API integration, browser acceptance and production Lighthouse were executed. The Compose launch remains unexecuted here.

## Environment

All credentials are server-side. None use a Vite client prefix. Blank provider credentials choose deterministic local behavior.

| Variable | Fill in when |
|---|---|
| 'DEMO_JUDGE_MODE=true' | One-click synthetic judge access; disable for a public operator deployment |
| 'PORT', 'WEB_ORIGIN' | API port and exact permitted browser origin; defaults 3001 / localhost:5173 |
| 'SITE_URL' | Canonical public origin at build time; use localhost:8080 for Compose, the real origin for deployment |
| 'COOKIE_SECURE=true' | Browser is behind HTTPS; leave false for local HTTP |
| 'MOJOAUTH_ISSUER', 'MOJOAUTH_CLIENT_ID', 'MOJOAUTH_CLIENT_SECRET' | Real passwordless operator login |
| 'MOJOAUTH_REDIRECT_URI' | Exact registered callback, e.g. http://localhost:5173/api/auth/mojo/callback |
| 'MOJOAUTH_AUDIENCE' | Access-token API audience if different from the client ID |
| 'MOJOAUTH_REVIEWER_SUBJECTS' | Comma-separated verified subjects allowed to approve |
| 'ANTHROPIC_API_KEY', 'ANTHROPIC_MODEL' | Real LLM tool planning; model must be accessible to your account |
| 'BENCHMARK_USE_LLM=true' | Explicitly opt into billable raw-log LLM baseline calls; false by default |
| 'LANGFUSE_PUBLIC_KEY', 'LANGFUSE_SECRET_KEY', 'LANGFUSE_BASE_URL' | Cloud or self-hosted investigation tracing |
| 'N8N_SHARED_SECRET' | Strong random secret matching n8n's Header Auth credential |
| 'N8N_BASE_URL' | Exact allowed origin of n8n waiting URLs |
| 'N8N_WEBHOOK_URL', 'N8N_REVIEW_WEBHOOK_URL' | Activated manual and human-review workflow URLs |
| 'NOTIFICATION_WEBHOOK_URL' | Optional approved-summary delivery target; blank sends nothing |
| 'LOG_LEVEL' | Server log verbosity; defaults to info |

The Docker defaults work without an env file. If copying the development example for Docker, change 'SITE_URL' and the MojoAuth callback to port 8080. The API's Compose browser origin is set explicitly. Generate 'N8N_SHARED_SECRET' before connecting real workflows, then follow [n8n setup](n8n/README.md).

## Measured results

<!-- BENCHMARK:START -->
| Investigator | Top-1 | Top-3 | Timeline τ | ECE | p95 |
|---|---:|---:|---:|---:|---:|
| ServiceShield | 81.5% | 100.0% | 0.964 | 0.055 | 37.9ms |
| Naive raw clocks (rules fallback) | 83.3% | 100.0% | 0.922 | 0.193 | 30.3ms |
| Rules without skew | 100.0% | 100.0% | 0.922 | 0.210 | 32.7ms |
| Ablation: no skew | 100.0% | 100.0% | 0.922 | 0.150 | 38.2ms |
| Ablation: no gap reasoning | 81.5% | 100.0% | 0.964 | 0.089 | 36.1ms |
| Ablation: no counterfactuals | 81.5% | 100.0% | 0.964 | 0.088 | 33.2ms |

Raw → calibrated ECE: **0.0704 → 0.0548**. Held-out improvement measured.
<!-- BENCHMARK:END -->

The final held-out set uses seeds 400–405; fit seeds are 0–9. **Top-1 counts abstentions as incorrect.** The no-skew rules baseline has higher catalog top-1 coverage in these synthetic scenarios. ServiceShield improves timeline ordering, reports what could not be established, and exposes the comparison. Selective accuracy, abstention, variance, onset errors, overlap recall, evidence precision/recall, semantic faithfulness, raw/calibrated Brier and reliability bins are in [the full results](docs/BENCHMARK.md) and 'data/benchmark.json'. Low citation recall and zero/negative ablation gains are disclosed. Benchmark time is analyzer time, not end-to-end browser or provider latency.

## Partner checklist

| Partner / choice | Implemented and locally verified | Requires operator configuration |
|---|---|---|
| MojoAuth · BIOS authentication | OIDC/PKCE adapter, verified JWT boundary, hashed sessions, Investigator/Reviewer roles, judge fallback | Real client, issuer, callback and successful account login |
| n8n · BIOS automation | Four authenticated workflow exports, waiting-URL allowlist, callback register, automation cannot approve, publish checks recorded human approval | Import, bind Header Auth credential, activate workflows and observe real execution |
| TechnoTribes · BIOS track | Production-style agent loop, human approval and audit trail, precise track credit | No proprietary product use or connection claimed |
| Tin Computer · BIOS growth | Fast SEO landing, local fonts, metadata/sitemap/robots and [connection guide](docs/GROWTH.md) | GitHub/analytics connection is not activated or claimed |
| Langfuse · independent choice | Scoped SDK/OTel adapter, case trace/stage spans/token metadata, local trace replay and failure fallback | Keys and a received cloud trace; not a BIOS sponsor |

All product sponsor wording is centralized in 'apps/web/src/config/sponsors.ts'. '/partners' and '/api/health' distinguish configured integrations from observed attempts. Adapter tests and workflow exports are not claims of successful remote integrations. [Official sources and account verification steps](docs/INTEGRATIONS.md) record the contracts checked during implementation.

## Decisions and honest limits

- Rules always perform numerical analysis and own the evidence-validated report. When configured, the LLM chooses available tools; 'source: ai' identifies validated planning, not a claim that the model independently proved the cause. Invalid output is rejected and retried once, then rules resume.
- Clock uncertainty is relative to the gateway, assumes bounded slow drift and positive latency, and widens when timing pairs disappear. There is no absolute UTC oracle.
- Twin cure intervals cover stochastic replay variance only. They exclude model mismatch and are not proof of a live-system repair.
- Synthetic calibration does not certify production confidence. Severe clock uncertainty can produce abstention despite surviving catalog-specific metrics. The simple baseline can be correct while the investigator honestly declines a confident conclusion.
- Gap classifications are reasoned possibilities, not recovered logs. Neither AI nor the twin alters evidence.
- A report's root CI is an approximate finite-sample sensitivity interval with a disclosed reference sample size, not a validated production confidence interval.
- OIDC pending state and live SSE subscribers are process-local; SQLite audit/session/case data persist. This is a single-instance hackathon prototype, not a horizontally scaled deployment.
- Notifications require an explicit configured target and human-approved publication. No real message or external project connection was performed during the build.

Use **L** for the Life/System lens, **/** for case search, **?** for help, and **Esc** for drawers/dialogs. Reduced-motion preferences are respected. All data is synthetic, and there is no automated remediation or access to real public-service infrastructure.

MIT licensed; bundled font licenses are in 'apps/web/public/fonts'.
