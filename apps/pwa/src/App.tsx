import { useEffect, useState } from 'react';
import { Link, NavLink, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  RefreshCw,
  ShieldCheck,
  Settings,
  FlaskConical,
  ArrowRight,
  Plus,
  Menu,
  Wifi,
  WifiOff,
  HelpCircle,
  LockKeyhole,
  Activity,
  CheckCircle2,
  GraduationCap,
  Building2,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import { AppProvider, useKuka } from './lib/context';
import { I18nProvider, useI18n } from './lib/i18n';
import LanguageSwitcher from './components/LanguageSwitcher';
import { activateWorkspace, enroll, Vault, vault } from './lib/vault';
import { listWorkspaces, rememberActiveWorkspace } from './lib/workspaces';
import { Badge, Notice, PageTitle, Submit, time } from './components/UI';
import QuickSearch from './components/QuickSearch';
import { displayRole, isPatientRecord } from './lib/presentation';
import { Today, Children, School } from './pages/DataEntry';
import { ChildDetail, Conflicts, SettingsPage, Admin, About } from './pages/Workspace';
import GovernmentResources from './components/GovernmentResources';
import Lab from './pages/Lab';
import PublicHome from './components/PublicHome';
import RouteMetadata, { isWorkspaceRoute } from './components/RouteMetadata';
import DeviceGate from './components/DeviceGate';
import { newId, timeoutSignal } from './lib/platform';
const schoolNav = [
  ['/app/today', 'Overview', LayoutDashboard],
  ['/app/children', 'Children', Users],
  ['/app/school', 'Classroom', GraduationCap],
  ['/app/library', 'Government schemes', Building2],
  ['/app/conflicts', 'Conflict inbox', ShieldCheck],
] as const;
function Brand() {
  const { t } = useI18n();
  return (
    <Link className="brand" to="/app/today">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <ellipse cx="24" cy="24" rx="18" ry="7" />
          <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(60 24 24)" />
          <ellipse cx="24" cy="24" rx="18" ry="7" transform="rotate(120 24 24)" />
          <circle className="orbit-core" cx="24" cy="24" r="3" />
          <circle className="orbit-node" cx="33" cy="11" r="2.5" />
        </svg>
      </span>
      <span className="brand-copy">
        <strong>Smriva</strong>
        <small> {t('School records')}</small>
      </span>
      <span className="brand-mobile-label visually-hidden">{t('Smriva workspace')}</span>
    </Link>
  );
}
function preferredDarkTheme() {
  try {
    const saved =
      localStorage.getItem('smriva-theme') ??
      localStorage.getItem('setusync-theme') ??
      localStorage.getItem('kuka-theme');
    return saved !== 'light';
  } catch {
    return true;
  }
}
function ThemeToggle() {
  const { t } = useI18n();
  const [dark, setDark] = useState(preferredDarkTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    try {
      localStorage.setItem('kuka-theme', dark ? 'dark' : 'light');
      localStorage.setItem('setusync-theme', dark ? 'dark' : 'light');
      localStorage.setItem('smriva-theme', dark ? 'dark' : 'light');
    } catch {}
  }, [dark]);
  return (
    <button
      className="icon-button"
      aria-label={dark ? t('Use light theme') : t('Use dark theme')}
      onClick={() => setDark(!dark)}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
function Unlock() {
  const { t } = useI18n();
  const { refresh, notify } = useKuka(),
    [exists, setExists] = useState<boolean | null>(null),
    [pin, setPin] = useState(''),
    [actor, setActor] = useState(''),
    [role, setRole] = useState('Reviewer'),
    [enrollmentCode, setEnrollmentCode] = useState(''),
    [demoEnrollment, setDemoEnrollment] = useState(true),
    [showPin, setShowPin] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    vault
      .exists()
      .then(setExists)
      .catch((e) => setError('Local storage could not be read: ' + e.message));
    fetch('/api/health', { signal: timeoutSignal(5000) })
      .then((r) => r.json())
      .then((info) => setDemoEnrollment(info.demo === true))
      .catch(() => {});
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (exists) await vault.unlock(pin);
      else {
        const identity = await enroll(actor, role, enrollmentCode || undefined);
        await vault.create(pin, identity);
      }
      refresh();
      notify('Workspace unlocked · encryption active');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="unlock-page">
      <LanguageSwitcher />
      <div className="unlock-home">
        <Brand />
      </div>
      <div className="unlock-card">
        <div className="unlock-icon">
          <LockKeyhole size={28} />
        </div>
        <p className="eyebrow">{t('SMRIVA WORKSPACE')}</p>
        <h1>{exists ? t('Unlock workspace') : t('Set up this device')}</h1>
        <p className="muted">
          {exists
            ? t('Unlock your encrypted records. Your PIN works without internet.')
            : t('Create your device’s encrypted workspace. Initial enrollment needs the local hub.')}
        </p>
        {listWorkspaces().length > 1 && (
          <label>
            {t('Saved workspace')}
            <select
              aria-label={t('Saved workspace')}
              value={vault.name}
              disabled={busy}
              onChange={async (e) => {
                setBusy(true);
                setError('');
                try {
                  await activateWorkspace(new Vault(e.target.value));
                  setPin('');
                  setShowPin(false);
                  setExists(await vault.exists());
                  refresh();
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {listWorkspaces().map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <form onSubmit={submit}>
          {!exists && (
            <>
              <label>
                {t('Your name')}
                <input
                  id="enroll-name"
                  name="actor"
                  autoComplete="name"
                  value={actor}
                  placeholder={t('Enter your name')}
                  onChange={(e) => setActor(e.target.value)}
                  required
                  minLength={2}
                />
              </label>
              {demoEnrollment && (
                <label>
                  {t('Your role')}
                  <select
                    id="enroll-role"
                    name="role"
                    aria-label={t('Your role')}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {['Reviewer', 'Teacher', 'Hub Admin'].map((r) => (
                      <option key={r} value={r}>
                        {t(displayRole(r))}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                {t('Enrollment code')}
                <input
                  type="password"
                  aria-label={t('Enrollment code')}
                  id="enrollment-code"
                  name="enrollment-code"
                  value={enrollmentCode}
                  onChange={(e) => setEnrollmentCode(e.target.value)}
                  autoComplete="off"
                  required={!demoEnrollment}
                  placeholder={
                    demoEnrollment
                      ? t('Optional in synthetic demo mode')
                      : t('Administrator invitation or initial bootstrap code')
                  }
                />
              </label>
            </>
          )}
          <label>
            {exists ? t('Device PIN') : t('Choose a device PIN')}
            <input
              type={showPin ? 'text' : 'password'}
              id="device-pin"
              name="device-pin"
              disabled={busy || exists === null}
              inputMode="numeric"
              pattern="[0-9]{6,12}"
              minLength={6}
              maxLength={12}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder={t('6–12 digits')}
              autoComplete={exists ? 'current-password' : 'new-password'}
              required
              autoFocus
            />
          </label>
          <button
            className="text-link pin-visibility"
            type="button"
            aria-label={showPin ? t('Hide PIN') : t('Show PIN')}
            aria-pressed={showPin}
            onClick={() => setShowPin(!showPin)}
          >
            {showPin ? t('Hide PIN') : t('Show PIN')}
          </button>
          {exists && (
            <p className="fine">{t('Use the PIN you chose for this browser. There is no default PIN.')}</p>
          )}
          {error && <Notice tone="coral">{error}</Notice>}
          <Submit
            busy={busy || exists === null}
            label={exists ? t('Unlock workspace') : t('Create demo workspace')}
          />
        </form>
        <p className="fine">
          {t(
            'This is a demonstration project. Your PIN protects a random encryption key with PBKDF2. Remember it, and save your recovery code in Settings.',
          )}
        </p>
        <Link className="text-link" to="/recover">
          {exists ? t('Forgot PIN?') : t('Recover a lost device')} <ArrowRight size={14} />
        </Link>
      </div>
    </main>
  );
}
function Recovery() {
  const { t } = useI18n();
  const { refresh } = useKuka(),
    navigate = useNavigate(),
    [code, setCode] = useState(''),
    [pin, setPin] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [demo, setDemo] = useState(false),
    [hasWorkspace, setHasWorkspace] = useState(false);
  useEffect(() => {
    vault
      .exists()
      .then(setHasWorkspace)
      .catch(() => {});
    fetch('/api/health', { signal: timeoutSignal(5000) })
      .then((r) => r.json())
      .then((info) => setDemo(info.demo === true))
      .catch(() => {});
  }, []);
  return (
    <main className="standalone">
      <LanguageSwitcher />
      <Brand />
      <div className="unlock-card">
        <p className="eyebrow">{t('KEEP YOUR RECORDS')}</p>
        <h1>{t('Forgot your PIN?')}</h1>
        <p className="muted">
          {t(
            'The PIN encrypts a key on this browser and cannot be retrieved or reset. Use your saved recovery code to create a workspace with a new PIN and restore synchronized records from the hub.',
          )}
        </p>
        {hasWorkspace && (
          <Notice>
            {t(
              'Your original encrypted workspace stays on this browser. Unsynchronized records and drafts remain locked until you remember its PIN, or restore a separately encrypted backup in Settings.',
            )}
          </Notice>
        )}
        {!done && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              const candidate = new Vault('recovered-' + newId());
              try {
                // Check browser storage before the hub consumes the one-time recovery code.
                rememberActiveWorkspace(vault.name);
                await candidate.db.open();
                const r = await fetch('/api/recover', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ recovery: code, actor: 'Recovered worker' }),
                  signal: timeoutSignal(15000),
                });
                const identity = await r.json();
                if (!r.ok) throw new Error(identity.error);
                await candidate.create(pin, identity);
                await activateWorkspace(candidate, 'Recovered workspace');
                setCode('');
                setPin('');
                setDone(true);
                refresh();
                try {
                  await vault.sync();
                } catch (err: any) {
                  setError(
                    'Your new workspace is saved. Reconnect and use Sync center to finish restoring hub records. ' +
                      err.message,
                  );
                }
                refresh();
              } catch (e: any) {
                candidate.db.close();
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              {t('Recovery code')}
              <input
                name="recovery-code"
                id="recovery-code"
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </label>
            <label>
              {t('New device PIN')}
              <input
                type="password"
                id="new-device-pin"
                name="new-device-pin"
                autoComplete="new-password"
                inputMode="numeric"
                pattern="[0-9]{6,12}"
                minLength={6}
                maxLength={12}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </label>
            <p className="fine">
              {t(
                'Recovery revokes the previous device identity. Its later uploads go to quarantine. It does not decrypt the old local workspace.',
              )}
            </p>
            {error && <Notice tone="coral">{error}</Notice>}
            <Submit busy={busy} label={t('Recover from hub')} />
          </form>
        )}
        {done && (
          <>
            <Notice tone="green">
              {t('Your new encrypted workspace is saved. Your original workspace has been kept.')}
            </Notice>
            {error && <Notice>{error}</Notice>}
            <Link className="button primary" to="/app/today">
              {t('Open restored workspace')}
              <ArrowRight size={16} />
            </Link>
          </>
        )}
        {demo && !done && (
          <section className="recovery-demo">
            <h2>{t('No recovery code? Continue the demo.')}</h2>
            <p className="muted">
              {t(
                'Start a separate synthetic workspace and choose a new PIN. The original encrypted workspace is kept. Hub records will sync after enrollment; unsynchronized local entries stay in the original workspace.',
              )}
            </p>
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await activateWorkspace(new Vault('demo-' + newId()), 'Separate demo workspace');
                  refresh();
                  navigate('/app/today');
                } catch (err: any) {
                  setError(err.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t('Start a separate demo workspace')}
            </button>
          </section>
        )}
        <Link to="/app/today" className="text-link">
          {t('Back to unlock')}
        </Link>
      </div>
    </main>
  );
}

function Shell() {
  const { t, locale } = useI18n();
  const { unlocked, refresh, status, sync, offlineReady, offlineUnavailable } = useKuka(),
    [mobile, setMobile] = useState(false),
    [collapsed, setCollapsed] = useState(false),
    location = useLocation();
  useEffect(() => setMobile(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!unlocked) return;
    const renewIfNeeded = () => {
      const expires = vault.state?.identity.expires ?? 0;
      if (navigator.onLine && expires - Date.now() <= 10 * 60 * 1000)
        void vault
          .renewSession()
          .then(refresh)
          .catch(() => {});
    };
    renewIfNeeded();
    const timer = window.setInterval(renewIfNeeded, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [unlocked, refresh]);
  if (!unlocked) return <Unlock />;
  const identity = vault.state!.identity,
    pending = vault.pending.length,
    conflicts = vault.view.conflicts.filter((entry) => {
      const person = vault.view.entities[entry.entityId.split(':')[0]];
      return person?.type === 'child' && !isPatientRecord(person);
    }).length,
    personCount = Object.values(vault.view.entities).filter(
      (person) =>
        person.type === 'child' &&
        !person.deleted &&
        !person.id.startsWith('lab-') &&
        !isPatientRecord(person),
    ).length,
    activeNav = schoolNav;
  const section =
    activeNav.find(([path]) => location.pathname.startsWith(path))?.[1] ??
    (location.pathname.startsWith('/lab')
      ? 'Resilience lab'
      : location.pathname === '/admin'
        ? 'Hub & devices'
        : 'Settings');
  return (
    <div className={'app-shell ' + (mobile ? 'nav-open ' : '') + (collapsed ? 'sidebar-collapsed' : '')}>
      <a className="skip-link" href="#main">
        {t('Skip to content')}
      </a>
      <header className="global-header">
        <button
          className="icon-button nav-toggle"
          aria-label={t('Open navigation')}
          aria-expanded={mobile}
          onClick={() => {
            if (window.matchMedia('(max-width: 700px)').matches) setMobile(!mobile);
            else setCollapsed(!collapsed);
          }}
        >
          <Menu size={19} />
        </button>
        <Brand />
        <div className="global-actions">
          <QuickSearch />
          <details className="new-menu">
            <summary className="button outline new-global" aria-label={t('New')}>
              <Plus size={16} />
              <span>{t('New')}</span>
              <ChevronDown size={14} />
            </summary>
            <div className="new-menu-options">
              <Link to="/app/children?new=student">
                <GraduationCap size={15} /> {t('Student')}
              </Link>
            </div>
          </details>
          <Link to="/about" className="icon-button" aria-label={t('About Smriva')}>
            <HelpCircle size={18} />
          </Link>
          <button
            className="avatar small"
            onClick={() => {
              vault.lock();
              refresh();
            }}
            aria-label={t('Lock workspace')}
            title={identity.actorId + ' · ' + t('Lock workspace')}
          >
            <LockKeyhole size={17} aria-hidden="true" />
          </button>
        </div>
      </header>
      <nav className="repo-tabs" aria-label={t('Workspace sections')}>
        {activeNav.map(([path, label, Icon]) => (
          <NavLink key={path} to={path}>
            <Icon size={16} />
            <span>{t(label)}</span>
            {path.includes('conflicts') && <span className="counter">{conflicts}</span>}
            {path.includes('children') && <span className="counter">{personCount}</span>}
          </NavLink>
        ))}
      </nav>
      {mobile && (
        <button className="nav-scrim" aria-label={t('Close navigation')} onClick={() => setMobile(false)} />
      )}
      <aside className="sidebar" aria-label={t('Workspace navigation')}>
        <div className="sidebar-heading">
          <Building2 size={16} />
          <strong>{t('Smriva workspace')}</strong>
        </div>
        <div className="nav-label">{t('Workspace')}</div>
        <nav aria-label={t('Main navigation')}>
          {activeNav.map(([path, label, Icon]) => (
            <NavLink key={path} to={path}>
              <Icon size={16} />
              <span>{t(label)}</span>
              {path.includes('conflicts') && conflicts > 0 && <span className="counter">{conflicts}</span>}
              {path.includes('sync') && pending > 0 && <span className="counter">{pending}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="nav-label tools-label">{t('Tools')}</div>
        <nav aria-label={t('Workspace tools')}>
          <>
            <NavLink to="/lab">
              <FlaskConical size={16} />
              <span>{t('Resilience lab')}</span>
            </NavLink>
            <NavLink to="/admin">
              <Activity size={16} />
              <span>{t('Record database')}</span>
            </NavLink>
          </>
          <NavLink to="/app/settings">
            <Settings size={16} />
            <span>{t('Settings, sync & recovery')}</span>
            {pending > 0 && <span className="counter">{pending}</span>}
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <ShieldCheck size={16} />
            <div>
              <strong>{t('Encrypted local storage')}</strong>
              <p>{t('Entries save on this device first.')}</p>
              <Link to="/app/settings#sync">{t('View backup status')}</Link>
            </div>
          </div>
          <div className="sidebar-user">
            <span className="avatar small">
              {identity.actorId
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <strong>{identity.actorId}</strong>
              <small>{t(displayRole(identity.role))}</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <div className="topbar" role="region" aria-label={t('Workspace controls')}>
          <LanguageSwitcher />
          <div className="mode-and-breadcrumb">
            <div className="breadcrumb">
              <strong>{t(section)}</strong>
            </div>
          </div>
          <div className="top-actions">
            <ThemeToggle />
            <button
              className={'connection-pill ' + (status === 'Offline' ? 'offline' : '')}
              onClick={() => void sync()}
              disabled={status === 'Syncing'}
            >
              {status === 'Offline' ? <WifiOff size={14} /> : <Wifi size={14} />} {t(status)}
              <RefreshCw size={13} className={status === 'Syncing' ? 'spin' : ''} />
            </button>
          </div>
        </div>
        <div className="durability-strip" role="region" aria-label={t('Record durability')}>
          <Link to="/app/settings#sync">
            {pending} {t('pending')}
          </Link>
          <Link to="/app/conflicts">
            {conflicts} {t('conflicts')}
          </Link>
          <span className="shell-ready">
            {offlineReady
              ? t('Offline ready')
              : offlineUnavailable
                ? t('Offline installation unavailable in this browser')
                : t('Preparing offline shell…')}
          </span>
          <span>
            {t('Last backup')}: {time(vault.state?.lastSync ?? 0, locale)}
          </span>
        </div>
        <main id="main" className="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/app/today" element={<Today />} />
            <Route path="/app/children" element={<Children />} />
            <Route path="/app/children/:id" element={<ChildDetail />} />
            <Route path="/app/school" element={<School />} />
            <Route
              path="/app/library"
              element={
                <div className="schemes-page">
                  <PageTitle eyebrow="Education" title="Government schemes" />
                  <GovernmentResources />
                </div>
              }
            />
            <Route path="/app/sync" element={<Navigate to="/app/settings#sync" replace />} />
            <Route path="/app/conflicts" element={<Conflicts />} />
            <Route path="/app/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/lab/*" element={<Lab />} />
            <Route path="*" element={<Navigate to="/app/today" />} />
          </Routes>
        </main>
        <nav className="mobile-bottom-nav" aria-label={t('Quick navigation')}>
          {[activeNav[0], activeNav[1], activeNav[2], ['/app/settings', 'Settings', Settings] as const].map(
            ([path, label, Icon]) => (
              <NavLink key={path} to={path}>
                <Icon size={18} />
                <span>{t(label)}</span>
              </NavLink>
            ),
          )}
        </nav>
        <footer className="app-footer">
          <span>{t('Smriva · Demonstration project · No real personal records')}</span>
          <span>
            <Link to="/about">{t('Sources & method')}</Link>
            <a href="https://biosv2.devfolio.co/" target="_blank" rel="noreferrer">
              {t('Built at BIOS V2')}
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}
function Root() {
  const { t } = useI18n();
  const { toast } = useKuka();
  useEffect(() => {
    document.documentElement.dataset.theme = preferredDarkTheme() ? 'dark' : 'light';
  }, []);
  return (
    <>
      <RouteMetadata />
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/about" element={<About />} />
        <Route path="/attributions" element={<Navigate to="/about" replace />} />
        <Route path="/partners" element={<Navigate to="/about" replace />} />
        <Route
          path="/recover"
          element={
            <DeviceGate>
              <Recovery />
            </DeviceGate>
          }
        />
        <Route path="*" element={<WorkspaceOrNotFound />} />
      </Routes>
      {toast && (
        <div role="status" className="toast">
          <CheckCircle2 size={17} />
          {t(toast)}
        </div>
      )}
    </>
  );
}
function WorkspaceOrNotFound() {
  const { t } = useI18n();
  const { pathname } = useLocation();
  if (isWorkspaceRoute(pathname))
    return (
      <DeviceGate>
        <Shell />
      </DeviceGate>
    );
  return (
    <main className="public-not-found">
      <p className="eyebrow">SMRIVA · 404</p>
      <h1>{t('We couldn’t find that page.')}</h1>
      <p>{t('Check the address, or return to your workspace.')}</p>
      <Link className="button primary" to="/app/today">
        {t('Open workspace')}
        <ArrowRight size={16} />
      </Link>
      <p>
        <a href="/">{t('Go to Smriva home')}</a>
      </p>
    </main>
  );
}
export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </I18nProvider>
  );
}
