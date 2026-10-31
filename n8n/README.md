# ServiceShield workflows

These are importable n8n workflows, inactive until configured. No remote execution is claimed by shipping an export.

1. Start n8n with `docker compose up` and open http://localhost:5678. Complete its local owner setup.
2. In n8n Credentials, create **Header Auth**, named **ServiceShield shared secret**, with name `x-n8n-secret` and value equal to `N8N_SHARED_SECRET`. Generate the secret yourself; exports contain no secret. Select this credential in every HTTP Request, Webhook, and Wait node. The ID in the export is a reference to rebind, not a working credential.
3. Import all four JSON files. Set n8n environment `SERVICESHIELD_API_URL=http://api:3001` (Compose does this). Environment access is enabled only for this local demonstration.
4. Activate manual and human-approval workflows. Configure API `N8N_WEBHOOK_URL=http://n8n:5678/webhook/serviceshield-investigate` and `N8N_REVIEW_WEBHOOK_URL=http://n8n:5678/webhook/serviceshield-report-ready`. Set `N8N_BASE_URL` to the exact origin in the Wait node's generated resume URL. In Compose it is `http://n8n:5678`.
5. Restart the API after changing env. In Lab, use **Investigate now · workflow**. Watch the real execution callback on `/automation` and the case report. If n8n cannot accept the webhook, the local investigator runs and the UI reports fallback.
6. A completed report triggers human approval. The workflow registers its unique waiting URL with the API. In the case Report tab, a signed-in Reviewer clicks Approve. The API records that human identity, then resumes the waiting workflow using Header Auth. Its publish call still checks the stored approval. An automation identity cannot approve a report.
7. `NOTIFICATION_WEBHOOK_URL` is optional. Without it, notification returns `{configured:false,accepted:false}` and no message is sent. Never describe that as a delivered notification.
8. Activate the detector and nightly workflows when desired. Detector reads the latest **synthetic** metric window and creates a new simulated case when its error threshold is breached. Nightly dispatch starts a real benchmark subprocess; its independent completion row records success or failure. Dispatch success is not benchmark completion.

The dashboard shows only actual signed execution callbacks and actual benchmark subprocess status. It does not invent n8n executions. A workflow error before a status node remains visible in n8n's own execution history; the dashboard does not claim to mirror all remote errors. Keep execution data private because Wait URLs are sensitive capabilities, even though this project additionally authenticates them.
