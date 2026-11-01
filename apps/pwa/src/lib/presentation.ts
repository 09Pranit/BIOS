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
