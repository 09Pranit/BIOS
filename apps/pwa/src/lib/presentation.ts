/** Friendly labels only. API values and stored permissions remain unchanged. */
export function displayRole(role: string): string {
  const labels: Record<string, string> = {
    Reviewer: 'Community member',
    Teacher: 'Teacher',
    'Health Worker': 'Legacy account',
    'Hub Admin': 'Administrator',
  };
  return labels[role] ?? role;
}

/** Untagged legacy records belong to the school roster. */
export const isPatientRecord = (record: { tags?: string[] }) => record.tags?.includes('patient') === true;

/** Display labels preserve the immutable authors recorded in the operation log. */
export function displayActor(operation: { deviceId: string; actorId: string }): string {
  const labels: Record<string, string> = {
    seed: 'Data',
    'seed-doctor-v1': 'Data',
    'seed-conflict-a-v1': 'Data · classroom tablet',
    'seed-conflict-b-v1': 'Data · school register',
  };
  return labels[operation.deviceId] ?? operation.actorId;
}
