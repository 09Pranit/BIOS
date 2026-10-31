const labels: Record<string, string> = {
  '/app/today': 'Home',
  '/app/children': 'Children',
  '/app/school': 'Attendance & marks',
  '/app/health': 'Health',
  '/app/library': 'Learn',
  '/app/sync': 'Save & share',
  '/app/conflicts': 'Check differences',
};
export const easyPageLabel = (path: string, fallback: string) => labels[path] ?? fallback;
const connectionLabels: Record<string, string> = {
  Connecting: 'Checking connection',
  Synced: 'Up to date',
  Offline: 'Working offline',
  Syncing: 'Sharing…',
  'Needs attention': 'Needs a check',
  'Pending sync': 'Waiting to share',
};
export const easyConnectionLabel = (status: string) => connectionLabels[status] ?? status;
