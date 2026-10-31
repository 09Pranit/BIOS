import { formatDisplayDate, useI18n } from '../lib/i18n';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Heart,
  LockKeyhole,
  RefreshCw,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useKuka } from '../lib/context';
import { vault } from '../lib/vault';
import { localDate } from '../lib/entry';

const activities = [
  {
    title: 'Add a child',
    description: 'Enter a child’s details and guardian consent.',
    to: '/app/children?new=1',
    icon: UserPlus,
  },
  {
    title: 'Mark attendance',
    description: 'Choose the class and date, then mark each child.',
    to: '/app/school',
    icon: ClipboardCheck,
  },
  {
    title: 'Enter marks',
    description: 'Record assessment scores or finish saved drafts.',
    to: '/app/school?tab=assessments',
    icon: GraduationCap,
  },
  {
    title: 'Add a health visit',
    description: 'Select a child and record the visit details.',
    to: '/app/health',
    icon: Heart,
  },
  {
    title: 'Open learning activities',
    description: 'Read a lesson or try a practice activity.',
    to: '/app/library',
    icon: BookOpen,
  },
  {
    title: 'Find a child',
    description: 'Search saved children and open their records.',
    to: '/app/children',
    icon: Search,
  },
] as const;

export default function EasyDashboard() {
  const { t, locale } = useI18n();
  const { status, sync, error, offlineReady } = useKuka(),
    state = vault.state,
    view = vault.view,
    children = Object.values(view.entities).filter(
      (child) => child.type === 'child' && !child.deleted && !child.id.startsWith('lab-'),
    ),
    today = localDate(),
    marked = children.filter((child) => {
      const id = `${child.id}:${today}`;
      return (
        view.entities[id]?.attendance !== undefined &&
        !view.conflicts.some((conflict) => conflict.entityId === id && conflict.field === 'attendance')
      );
    }).length,
    draftCount = Object.entries(state?.entryDrafts ?? {}).filter(
      ([key, value]) => key.startsWith('score|') && value.trim() !== '',
    ).length,
    pending = vault.pending.length,
    conflictCount = view.conflicts.length,
    quarantined = state?.quarantined.length ?? 0,
    firstName = state?.identity.actorId.trim().split(/\s+/)[0],
    offline = status === 'Offline' || !navigator.onLine,
    syncing = status === 'Syncing';
  return (
    <div className="easy-home">
      <header className="easy-welcome">
        <p className="easy-greeting">
          {firstName ? t('Hello, {name}', { name: firstName }) : t('Welcome back')}
        </p>
        <h1>{t('What would you like to do?')}</h1>
        <p>{t('Choose an activity. Your entries save on this device, even without a connection.')}</p>
      </header>

      {(conflictCount > 0 || quarantined > 0) && (
        <section className="easy-attention" aria-label={t('Records need attention')}>
          <ShieldAlert size={25} aria-hidden="true" />
          <div>
            <h2>{t('Some changes need a person to check them')}</h2>
            <p>
              {conflictCount > 0 &&
                t(
                  conflictCount === 1
                    ? '{count} difference needs review.'
                    : '{count} differences need review.',
                  { count: conflictCount },
                )}{' '}
              {quarantined > 0 &&
                t('{count} submitted changes were set aside by the hub.', { count: quarantined })}{' '}
              {t('The original entries are kept.')}
            </p>
            <div className="easy-inline-links">
              {conflictCount > 0 && (
                <Link to="/app/conflicts">
                  {t('Review differences')}
                  <ArrowRight size={16} />
                </Link>
              )}
              {quarantined > 0 && (
                <Link to="/app/sync">
                  {t('Check changes set aside')}
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      <nav className="easy-activities" aria-label={t('Choose an activity')}>
        {activities.map(({ title, description, to, icon: Icon }) => (
          <Link key={to} className="easy-activity" to={to}>
            <span className="easy-activity-icon">
              <Icon size={23} aria-hidden="true" />
            </span>
            <span className="easy-activity-copy">
              <strong>{t(title)}</strong>
              <span>{t(description)}</span>
            </span>
            <ArrowRight className="easy-activity-arrow" size={21} aria-hidden="true" />
          </Link>
        ))}
      </nav>

      {draftCount > 0 && (
        <Link className="easy-draft-callout" to="/app/school?tab=assessments">
          <GraduationCap size={25} aria-hidden="true" />
          <span>
            <strong>{t('Continue entering marks')}</strong>
            <span>
              {t(
                draftCount === 1
                  ? '{count} unfinished score entry is kept encrypted on this device. Finish it to record the score.'
                  : '{count} unfinished score entries are kept encrypted on this device. Finish them to record the scores.',
                { count: draftCount },
              )}
            </span>
          </span>
          <ArrowRight size={21} aria-hidden="true" />
        </Link>
      )}

      <section className="easy-today" aria-labelledby="easy-today-title">
        <div className="easy-section-heading">
          <h2 id="easy-today-title">{t('On this device today')}</h2>
          <span>{formatDisplayDate(new Date(), locale, 'short')}</span>
        </div>
        <div className="easy-totals">
          <Link to="/app/children">
            <Users size={20} aria-hidden="true" />
            <strong>{children.length}</strong>
            <span>{t('children in the active list')}</span>
          </Link>
          <Link to="/app/school">
            <ClipboardCheck size={20} aria-hidden="true" />
            <strong>{t('{marked} of {total}', { marked, total: children.length })}</strong>
            <span>{t('attendance entries checked for today')}</span>
          </Link>
          <Link to="/app/sync">
            <RefreshCw size={20} aria-hidden="true" />
            <strong>{pending}</strong>
            <span>{t('changes waiting to copy to the hub')}</span>
          </Link>
        </div>
      </section>

      <section className="easy-saving" aria-labelledby="easy-saving-title">
        <div className="easy-section-heading">
          <h2 id="easy-saving-title">{t('Where are my records?')}</h2>
          <Link to="/app/sync">
            {t('See saving details')}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="easy-saving-columns">
          <div className="easy-saving-place">
            <LockKeyhole size={23} aria-hidden="true" />
            <div>
              <h3>{t('Saved here')}</h3>
              <p>
                {t(
                  'After a successful save, your entry is encrypted on this device. Keep using this browser to find it again.',
                )}
              </p>
            </div>
          </div>
          <div className="easy-saving-place">
            <CheckCircle2 size={23} aria-hidden="true" />
            <div>
              <h3>{t('Copied to village hub')}</h3>
              <p>
                {state?.lastSync
                  ? t('Last completed copy: {date}.', {
                      date: new Date(state.lastSync).toLocaleString(locale),
                    })
                  : t('This workspace has not completed a copy to the hub yet.')}{' '}
                {pending > 0
                  ? t(
                      pending === 1
                        ? '{count} newer change is still waiting.'
                        : '{count} newer changes are still waiting.',
                      { count: pending },
                    )
                  : state?.lastSync
                    ? t('No local changes are waiting to copy.')
                    : t('Connect and copy your changes when the village hub is reachable.')}
              </p>
            </div>
          </div>
        </div>
        <div className="easy-connection">
          <div>
            {offline ? <WifiOff size={21} aria-hidden="true" /> : <Wifi size={21} aria-hidden="true" />}
            <p>
              <strong>
                {t(offline ? 'You are offline' : syncing ? 'Copying changes…' : 'Ready to try a connection')}
              </strong>
              <span>
                {t(
                  offline
                    ? 'You can still enter records. Copy them when the hub is reachable.'
                    : 'The hub must acknowledge your changes before they count as copied.',
                )}
              </span>
            </p>
          </div>
          <button className="button primary" disabled={syncing} onClick={() => void sync()}>
            <RefreshCw size={18} className={syncing ? 'spin' : ''} aria-hidden="true" />
            {t(syncing ? 'Copying…' : 'Copy changes to hub')}
          </button>
        </div>
        {error && (
          <p className="easy-sync-error" role="status">
            {t('The copy could not finish:')} {error}{' '}
            {t('Your saved local records are kept. Check the connection and try again.')}
          </p>
        )}
        {!offlineReady && (
          <p className="easy-offline-note">
            {t(
              'Keep this page open until offline support finishes installing. Existing encrypted records stay in this browser.',
            )}
          </p>
        )}
      </section>

      <details className="easy-starting">
        <summary>{t('Three simple steps')}</summary>
        <ol>
          <li>
            <span>1</span>
            {t('Choose an activity')}
          </li>
          <li>
            <span>2</span>
            {t('Fill in the details')}
          </li>
          <li>
            <span>3</span>
            {t('Save on this device')}
          </li>
        </ol>
        <p>
          {t(
            'Look for the saved confirmation. You can copy saved changes to the village hub whenever a connection is available.',
          )}
        </p>
      </details>
      <details className="easy-tools">
        <summary>{t('More tools and settings')}</summary>
        <nav aria-label={t('More tools')}>
          <Link to="/app/sync">{t('Saving and sync details')}</Link>
          <Link to="/app/conflicts">{t('Review different entries')}</Link>
          <Link to="/app/settings">{t('PIN, backup and recovery')}</Link>
          <Link to="/admin">{t('Hub database')}</Link>
          <Link to="/lab">{t('Try the resilience lab')}</Link>
        </nav>
      </details>
    </div>
  );
}
