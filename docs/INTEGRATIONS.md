# Integration contracts and verification

Official documentation checked 31 October 2026 before implementing adapters:

| Provider | Official source | Contract used |
|---|---|---|
| MojoAuth | [Express OIDC guide](https://mojoauth.com/docs/webapp/nodejs-express/), [JWT handling](https://mojoauth.com/docs/authentication/handle-jwt-token/) | Discovery, authorization code with PKCE, state and nonce, server-side signature/issuer/audience/expiry verification. Reviewer subjects are server allowlisted. |
| n8n | [Webhook](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/), [Wait](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.wait/), [HTTP Request](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) | Header Auth credentials, unique authenticated waiting URLs, structured HTTP request bodies, signed status callbacks. |
| Anthropic | [TypeScript SDK](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript) | Server-only Messages API; model from env; bounded timeout; strict zod validation and evidence allowlist; reject and retry once, then rules fallback. |
| Langfuse | [TypeScript setup](https://langfuse.com/docs/observability/sdk/overview), [instrumentation](https://langfuse.com/docs/observability/sdk/instrumentation) | Current scoped SDK generation with OpenTelemetry span processor, one investigation root, stage spans, generation token usage, shutdown flush. No deprecated ingestion endpoint. |
| TechnoTribes | [Official company site](https://www.technotribes.ai/enterprise-ai) | Track credit for production AI workflows and agents only. No proprietary product or connection is claimed. |
| Tin Computer | [Official growth plan workflow](https://tin.computer/workflows/growth-plan), [official source repository](https://github.com/tin-computer/tin) | Repo and analytics connection guide only. Not connected or activated. |

Code adapters live in `apps/api/src/adapters`. `/api/health` distinguishes configuration from observed attempts. A queued trace is not proof of remote receipt. A webhook accepted response is not proof of completed automation. `/automation` records signed callbacks, and each case keeps an append-only application audit trail.

## Verify with real accounts

- MojoAuth: create an OIDC application, configure the issuer/client/redirect values, disable judge mode, sign in, and inspect `/api/me`. Set a trusted subject in `MOJOAUTH_REVIEWER_SUBJECTS` to grant review. An unsigned or expired token must receive 401.
- n8n: follow `n8n/README.md`; confirm a genuine execution ID, then prove a shared-secret caller cannot approve. Approve as a human and observe the workflow resume and publish.
- Anthropic: set key and accessible model; run a case. At least one validated tool step should show `source: ai`, a token count, and the report model. Invalid output, timeout, or no key returns rules steps. Numeric analysis remains deterministic.
- Langfuse: set keys and base URL; run one case; open the report trace link and verify case ID, stage names and token observations. No credentials were supplied during this build, so a successful cloud trace is **not verified here**.
- Tin Computer and TechnoTribes: inspect credits and `docs/GROWTH.md`. They do not require or imply an external account connection.

Local tests validate security boundaries, provider failure fallback, report citation validation, workflow structure, and offline completion. Live provider success requires operator-owned accounts and is not claimed by local tests.
