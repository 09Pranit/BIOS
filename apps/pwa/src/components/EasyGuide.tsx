import { useI18n } from '../lib/i18n';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, CircleHelp } from 'lucide-react';
import { useKuka } from '../lib/context';

type Guide = { title: string; steps: string[]; note?: string };
export default function EasyGuide() {
  const { t } = useI18n();
  const { easyMode } = useKuka(),
    { pathname, search } = useLocation();
  if (!easyMode || pathname === '/app/today') return null;
  let guide: Guide | undefined;
  if (pathname.startsWith('/app/children/'))
    guide = {
      title: 'Check this child’s record',
      steps: [
        'Check the name and details to make sure this is the right child.',
        'Open the section you need, or choose Edit to update the details.',
        'Save your changes and look for the saved confirmation.',
      ],
      note: 'If two entries disagree, review the difference before relying on either account.',
    };
  else if (pathname === '/app/children')
    guide = {
      title: 'Find or add a child',
      steps: [
        'Search by name, ID or village. Check the list to avoid adding the same child twice.',
        'Open a record, or choose New and then Student or Patient.',
        'For a new child, enter the details, confirm guardian consent and save on this device.',
      ],
    };
  else if (pathname === '/app/school')
    guide =
      new URLSearchParams(search).get('tab') === 'assessments'
        ? {
            title: 'Enter assessment marks',
            steps: [
              'Choose Assessments, then enter the title, attempt and class.',
              'Enter each child’s score from 0 to 100. A score of 0 is a valid mark.',
              'Check the row’s save status. Unfinished or invalid scores stay as drafts until corrected.',
            ],
            note: 'Drafts are kept on this device. Only successfully recorded scores can copy to the hub.',
          }
        : {
            title: 'Mark class attendance',
            steps: [
              'Choose Attendance, then check the date and class.',
              'Choose Present, Absent, Late or Excused for each child.',
              'Look for the saved status. You can safely continue without a connection.',
            ],
            note: 'Bulk marking fills unmarked children. Existing marks are kept.',
          };
  else if (pathname === '/app/health')
    guide = {
      title: 'Record a health event',
      steps: [
        'Find and select the child. Check their details in the selected-child panel.',
        'Choose the record type and date, then enter what was observed or administered.',
        'Choose Save health record and wait for the saved confirmation.',
      ],
      note: 'Keep each observation factual. The app records events; it does not provide a diagnosis.',
    };
  else if (pathname === '/app/library')
    guide = {
      title: 'Learn and practise',
      steps: [
        'Choose a lesson or activity from the library.',
        'Read the instructions and try the questions.',
        'Check the result and continue at your own pace.',
      ],
      note: 'Downloaded activities work offline. External resource links need a connection.',
    };
  else if (pathname === '/app/sync')
    guide = {
      title: 'Copy saved changes to the village hub',
      steps: [
        'Check how many changes are saved on this device and waiting to copy.',
        'When the hub is reachable, choose Sync with village hub.',
        'Wait for completion. If it stops, your local records are kept and you can retry.',
      ],
      note: '“Saved on this device” and “copied to the hub” are separate confirmations.',
    };
  else if (pathname === '/app/conflicts')
    guide = {
      title: 'Check entries that disagree',
      steps: [
        'Read both accounts and check who entered them.',
        'Verify the correct information with the responsible person.',
        'Keep the verified account, or enter a corrected value and save the decision.',
      ],
      note: 'Do not guess. Original entries remain in the history after a decision.',
    };
  else if (pathname === '/app/settings')
    guide = {
      title: 'Keep your workspace recoverable',
      steps: [
        'Save your recovery code somewhere private and separate from this device.',
        'Export an encrypted backup to keep records that have not copied to the hub.',
        'Keep the backup password private. You need it to restore that file.',
      ],
      note: 'A recovery code restores synchronized records. Unsynchronized records need their encrypted backup.',
    };
  else if (pathname === '/admin' || pathname.startsWith('/app/admin'))
    guide = {
      title: 'Use the offline record database',
      steps: [
        'Find the encrypted record stored on this device.',
        'Create or edit the details, then choose Save on device.',
        'Synchronize when a village hub connection is available.',
      ],
      note: 'Records work offline. Device management, enrollment, audit, and quarantine need a connection.',
    };
  else if (pathname === '/lab')
    guide = {
      title: 'Try the offline demonstration',
      steps: [
        'Start the guided demonstration using the synthetic lab records.',
        'Follow the steps to interrupt connections or make different edits.',
        'Reconnect and inspect how the records and differences are preserved.',
      ],
      note: 'The lab is a demonstration. Your real workspace is separate from the lab devices.',
    };
  if (!guide) return null;
  return (
    <aside className="easy-guide" aria-label={t('Page help')}>
      <div className="easy-guide-top">
        <Link to="/app/today">
          <ArrowLeft size={17} aria-hidden="true" />
          {t('Back to activities')}
        </Link>
        <span>{t('Step-by-step help')}</span>
      </div>
      <h2>{t(guide.title)}</h2>
      <details key={pathname + search} open>
        <summary>
          <CircleHelp size={18} aria-hidden="true" />
          {t('How to use this page')}
        </summary>
        <ol>
          {guide.steps.map((step) => (
            <li key={step}>{t(step)}</li>
          ))}
        </ol>
        {guide.note && <p>{t(guide.note)}</p>}
      </details>
    </aside>
  );
}
