/** Friendly labels only. API values and stored permissions remain unchanged. */
export function displayRole(role: string): string {
  const labels: Record<string, string> = {
    Reviewer: 'Community member',
    Teacher: 'Teacher',
    'Health Worker': 'Health worker',
    'Hub Admin': 'Administrator',
  };
  return labels[role] ?? role;
}
