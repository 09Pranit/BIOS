// No credentials or partner relationship is implied by a configurable adapter.
export const integrations = [
  {
    name: 'MojoAuth',
    purpose: 'Online identity',
    status: 'Not configured',
    detail: 'Local judge enrollment is implemented. A verified identity-provider adapter is not included.',
  },
  {
    name: 'n8n',
    purpose: 'Post-sync automation',
    status: 'Workflow template only',
    detail: 'An importable sync-report workflow is supplied. No notifications are sent by this demo.',
  },
  {
    name: 'Langfuse',
    purpose: 'Optional AI observability',
    status: 'Not configured',
    detail: 'No student data is sent to an AI service.',
  },
  {
    name: 'Tin Computer',
    purpose: 'Optional repository growth',
    status: 'Not connected',
    detail: 'Connection notes are in docs/GROWTH.md.',
  },
  {
    name: 'TechnoTribes',
    purpose: 'Potential workflow support',
    status: 'Not integrated',
    detail: 'No product integration or partner relationship is claimed.',
  },
];
