import React, { useState, useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Users,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  Check,
  Clock,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Activity,
  CloudUpload,
  LockKeyhole,
  Upload,
  Trash2,
  Printer,
  FileCheck,
  ChevronRight,
  Leaf,
  Layers,
  ArrowDownToLine,
  Filter,
  CalendarDays,
} from 'lucide-react';
import { useKuka } from '../lib/context';
import { languages, useI18n } from '../lib/i18n';
import { displayRole, isPatientRecord } from '../lib/presentation';
import { vault, download } from '../lib/vault';
import { readBackupFile } from '../lib/backup-file';
import { localCalendarDate, newId } from '../lib/platform';
import {
  PageTitle,
  Badge,
  Panel,
  Modal,
  Empty,
  initials,
  time,
  bytes,
  Submit,
  Form,
  Notice,
  External,
} from '../components/UI';
import { Bird, VillageArt } from '../components/Art';
import { reasonFor, compareOpsByClock, type Op } from '../../../../packages/sync-core/src/index';
const today = localCalendarDate;
const fieldLabels: Record<string, string> = {
  name: 'Child’s name',
  dob: 'Date of birth',
  guardian: 'Guardian',
  class: 'Class',
  village: 'Village',
  consent: 'Shared-record consent',
  attendance: 'Attendance',
  score: 'Score',
  deleted: 'Record deletion',
  doseStatus: 'Vaccination status',
  allergy: 'Allergy',
  prescription: 'Prescription',
  gender: 'Gender',
  phone: 'Phone',
};
function Metric({
  icon,
  value,
  label,
  note,
  tone = 'green',
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  note: string;
  tone?: string;
}) {
  const { t } = useI18n();
  return (
    <div className="metric">
      <div className={'metric-icon ' + tone}>{icon}</div>
      <div className="metric-top">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <p>
        <span className={'mini-dot ' + tone} />
        {note}
      </p>
    </div>
  );
}
export function ChildForm({ close, child }: { close: () => void; child?: any }) {
  const { t, locale, language } = useI18n();
  const { refresh, notify } = useKuka(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [formKey, setFormKey] = useState(0),
    [initialChild] = useState(() => (child ? { ...child } : undefined)),
    [observedAtStart] = useState(() => vault.state!.ops.slice()),
    [defaultClass, setDefaultClass] = useState(child?.class ?? 'Class 1'),
    newTitle = 'New student';
  return (
    <Modal title={t(child ? 'Edit record' : newTitle)} close={close}>
      <Form
        key={formKey}
        onSubmit={async (data) => {
          setBusy(true);
          try {
            if (String(data.get('name') ?? '').trim().length < 2)
              throw new Error(t('Enter a child name with at least two non-space characters.'));
            if (initialChild?.hasConflict)
              throw new Error(t("Review this record's conflicts before correcting its details."));
            const id = initialChild?.id ?? 'child-' + newId();
            const values: Parameters<typeof vault.writeMany>[0] = [
              { entityId: id, field: 'name', value: String(data.get('name')).trim() },
              { entityId: id, field: 'dob', value: String(data.get('dob')) },
              { entityId: id, field: 'guardian', value: String(data.get('guardian') ?? '') },
              {
                entityId: id,
                field: 'class',
                value: String(data.get('class')),
              },
              // Village is retained for older records and sync compatibility,
              // but is no longer requested when creating or editing a person.
              { entityId: id, field: 'village', value: initialChild?.village ?? 'Not specified' },
              { entityId: id, field: 'consent', value: true },
            ];
            if (!initialChild) values.push({ entityId: id, field: 'tags', value: 'student', kind: 'add' });
            // Correct only fields the person changed. Re-saving the whole form
            // would turn unrelated offline edits into avoidable conflicts.
            const changed = initialChild
              ? values.filter((entry) => !Object.is(initialChild[entry.field] ?? '', entry.value))
              : values;
            if (changed.length) await vault.writeMany(changed, observedAtStart);
            refresh();
            notify(t('Record saved on this device · encrypted'));
            if (data.get('continue') === 'yes') {
              setDefaultClass(String(data.get('class')));
              setError('');
              setFormKey((v) => v + 1);
            } else close();
          } catch (e: any) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {t('Child’s name')} <span className="required-mark">*</span>
          <input
            name="name"
            autoFocus
            required
            minLength={2}
            maxLength={80}
            defaultValue={initialChild?.name}
            autoComplete="off"
          />
        </label>
        <div className="form-grid">
          <label>
            {t('Date of birth')}
            <input type="date" name="dob" required max={today()} defaultValue={initialChild?.dob} />
          </label>
          <label>
            {t('Class')}
            <select aria-label={t('Class')} name="class" defaultValue={defaultClass}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={'Class ' + n}>
                  {t('Class')} {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t('Guardian’s name')}
          <input name="guardian" defaultValue={initialChild?.guardian} maxLength={80} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" required defaultChecked={Boolean(child?.consent)} />{' '}
          {t('Guardian consent obtained for the student record. Use synthetic details in this demo.')}
        </label>
        {error && <Notice tone="coral">{error}</Notice>}
        <div className="form-actions">
          <Submit busy={busy} label={t(child ? 'Save changes' : 'Save student')} />
          {!child && (
            <button className="button outline" type="submit" name="continue" value="yes" disabled={busy}>
              {t('Save and add another')}
            </button>
          )}
          <button type="button" className="button plain" onClick={close}>
            {t('Cancel')}
          </button>
        </div>
        <p className="fine">
          {t('Ctrl+Enter to save. Required fields are marked *. Records are encrypted before confirmation.')}
        </p>
      </Form>
    </Modal>
  );
}
export function ChildDetail() {
  const { t, locale, language } = useI18n();
  const { id } = useParams(),
    { write, version } = useKuka(),
    child = vault.view.entities[id!],
    [edit, setEdit] = useState(false);
  if (!child)
    return (
      <Empty
        title={t('Record not on this device')}
        description={t('Try syncing with the hub, or check the record ID.')}
      />
    );
  if (isPatientRecord(child))
    return (
      <Empty
        title={t('Record not in this workspace')}
        description={t('This record is not part of the education workspace.')}
      />
    );
  const related = vault
    .state!.ops.filter((o) => o.entityId === id || o.entityId.startsWith(id + ':'))
    .slice()
    .sort(compareOpsByClock)
    .reverse();
  return (
    <>
      <Link className="text-link" to="/app/children">
        {t('← All children')}
      </Link>
      <div className="child-header">
        <span className="avatar huge">{initials(child.name)}</span>
        <div>
          <p className="eyebrow">
            {child.id} {t('· Shared with consent')}
          </p>
          <h1>{child.name ?? t('Identity needs review')}</h1>
          <p className="muted">
            {child.class}
            {t('· Born')} {child.dob ?? t('Needs review')}
          </p>
        </div>
        <div className="button-row">
          <button className="button outline" onClick={() => window.print()}>
            <Printer size={16} /> {t('Print card')}
          </button>
          <button
            className="button primary"
            onClick={() => setEdit(true)}
            disabled={Boolean(child.hasConflict)}
            title={
              child.hasConflict
                ? t("Review this record's conflicts before correcting its details.")
                : undefined
            }
          >
            {t('Correct details')}
          </button>
        </div>
      </div>
      {child.hasConflict && (
        <Notice tone="coral">
          {t('This record has competing accounts.')}{' '}
          <Link to="/app/conflicts">{t('Review every version before making a decision.')}</Link>
        </Notice>
      )}
      <div className="dashboard-grid">
        <Panel title={t('Student details')}>
          <dl className="detail-list">
            <div>
              <dt>{t('Guardian')}</dt>
              <dd>{child.guardian || t('Not recorded')}</dd>
            </div>
            <div>
              <dt>{t('School')}</dt>
              <dd>{child.class}</dd>
            </div>
            <div>
              <dt>{t('Shared-record consent')}</dt>
              <dd>
                {t(
                  child.consent === true
                    ? 'Recorded'
                    : child.consent === null
                      ? 'Needs review'
                      : 'Not granted',
                )}
              </dd>
            </div>
            <div>
              <dt>{t('Tags')}</dt>
              <dd>{child.tags?.join(', ') || t('None')}</dd>
            </div>
          </dl>
          <button
            className="text-link danger"
            onClick={() => void write(child.id, 'deleted', true, 'delete').catch(() => {})}
          >
            <Trash2 size={14} /> {t('Mark record deleted (preserves history)')}
          </button>
          {child.deleted && (
            <button
              className="button outline"
              onClick={() => void write(child.id, 'deleted', false, 'resurrect').catch(() => {})}
            >
              {t('Restore record')}
            </button>
          )}
        </Panel>
      </div>
      <Panel
        title={t('Correction & operation history')}
        aside={<span className="fine">{t('Original versions are retained')}</span>}
      >
        <div className="audit-list">
          {related.slice(0, 20).map((o) => (
            <div key={o.opId}>
              <span className="audit-kind">{o.kind}</span>
              <div>
                <strong>{o.field}</strong>{' '}
                <span>{typeof o.value === 'string' ? o.value : JSON.stringify(o.value)}</span>
                <small>
                  {o.actorId} · {new Date(o.hlc.physical).toLocaleString(locale)}{' '}
                </small>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      {edit && <ChildForm child={child} close={() => setEdit(false)} />}
    </>
  );
}
export function Conflicts() {
  const { t, locale, language } = useI18n();
  const { version, write } = useKuka(),
    conflicts = vault.view.conflicts.filter((conflict) => {
      const person = vault.view.entities[conflict.entityId.split(':')[0]];
      return person?.type === 'child' && !isPatientRecord(person);
    }),
    [error, setError] = useState(''),
    [custom, setCustom] = useState<Record<string, string>>({});
  return (
    <>
      <PageTitle
        eyebrow={t('Record review')}
        title={t('Conflict inbox')}
        description={t(
          'Compare both entries before choosing a value. The original versions stay in the record.',
        )}
        action={
          <Badge tone={conflicts.length ? 'coral' : 'green'}>
            {conflicts.length} {t('open differences')}
          </Badge>
        }
      />
      {error && <Notice tone="coral">{error}</Notice>}
      {!conflicts.length ? (
        <Panel>
          <Empty
            icon={<ShieldCheck size={35} />}
            title={t('No unresolved conflicts')}
            description={t(
              'When people make incompatible changes independently, both accounts will appear here. Try a real concurrent edit in the resilience lab.',
            )}
          />
          <Link to="/lab" className="button outline centered">
            {t('Explore the lab')} <ArrowRight size={15} />
          </Link>
        </Panel>
      ) : (
        conflicts.map((c) => (
          <Panel
            key={c.id}
            title={`${vault.view.entities[c.entityId]?.name ?? c.entityId} · ${language === 'en' ? c.field : t(fieldLabels[c.field] ?? c.field)}`}
            aside={<Badge tone="coral">{t('Human review required')}</Badge>}
          >
            <p className="conflict-reason">
              {t(
                c.field === 'deleted'
                  ? 'A deletion and an edit happened independently. Both must be reviewed before the record changes.'
                  : 'Two people changed {field} without seeing each other’s work. A clock cannot decide which account is correct.',
                { field: t(fieldLabels[c.field] ?? c.field) },
              )}
            </p>
            <div className="conflict-versions">
              {c.versions.map((o) => (
                <article key={o.opId}>
                  <p className="eyebrow">{o.actorId}</p>
                  <h3>{typeof o.value === 'object' ? JSON.stringify(o.value) : String(o.value)}</h3>
                  <p className="fine">
                    {t('Device')} {o.deviceId.slice(-12)}
                    <br />
                    {new Date(o.hlc.physical).toLocaleString(locale)}
                    <br />
                    {o.kind} · {o.opId}
                  </p>
                  <button
                    className="button outline"
                    onClick={async () => {
                      try {
                        if (c.field === 'deleted') {
                          await write(
                            c.entityId,
                            'deleted',
                            o.field === 'deleted' ? o.value : false,
                            'resolve',
                            o.entityType,
                          );
                        } else await write(c.entityId, c.field, o.value, 'resolve', o.entityType);
                      } catch (e: any) {
                        setError(e.message);
                      }
                    }}
                  >
                    {t('Keep this account')} <Check size={15} />
                  </button>
                </article>
              ))}
            </div>
            {c.field !== 'deleted' && (
              <div className="custom-resolution">
                <label>
                  {t('Or enter a corrected value')}
                  <input
                    aria-label={t('Corrected {field}', { field: t(fieldLabels[c.field] ?? c.field) })}
                    value={custom[c.id] ?? ''}
                    onChange={(e) => setCustom({ ...custom, [c.id]: e.target.value })}
                  />
                </label>
                <button
                  className="button primary"
                  onClick={async () => {
                    try {
                      const raw = custom[c.id];
                      if (!raw?.trim()) throw new Error(t('Enter a corrected value'));
                      const value =
                        c.field === 'score' ? Number(raw) : c.field === 'consent' ? raw === 'true' : raw;
                      await write(c.entityId, c.field, value, 'resolve', c.versions[0].entityType);
                    } catch (e: any) {
                      setError(e.message);
                    }
                  }}
                >
                  {t('Save reviewed value')}
                </button>
              </div>
            )}
            <p className="fine">
              {t(
                'The resolution is a new operation with causal references to the alternatives. Independent conflicting resolutions remain reviewable.',
              )}
            </p>
          </Panel>
        ))
      )}
    </>
  );
}
export function SyncCenter() {
  const { t, locale } = useI18n();
  const { status, sync, error } = useKuka(),
    s = vault.state!;
  const overview = (
    <>
      <Panel
        title={t('Sync center')}
        aside={
          <button className="button primary" disabled={status === 'Syncing'} onClick={() => void sync()}>
            <RefreshCw size={16} className={status === 'Syncing' ? 'spin' : ''} /> {t('Sync now')}
          </button>
        }
      >
        <p>
          {t('Local storage and remote backup are different promises. See exactly where your work lives.')}
        </p>
      </Panel>
      {error && (
        <Notice tone="coral">
          {error} {t('Your local records remain saved. Reconnect and retry.')}
        </Notice>
      )}
      <div className="metrics">
        <Metric
          icon={<CloudUpload size={20} />}
          label={t('Waiting for backup')}
          value={vault.pending.length}
          note={t('Not yet acknowledged by the backup service')}
          tone="amber"
        />
        <Metric
          icon={<ShieldCheck size={20} />}
          label={t('Differences to check')}
          value={vault.view.conflicts.length}
          note={t('Every alternative kept')}
          tone="peach"
        />
        <Metric
          icon={<Clock size={20} />}
          label={t('Last backup')}
          value={time(s.lastSync, locale)}
          note={t('Durable cursor: {cursor}', { cursor: s.cursor })}
          tone="blue"
        />
      </div>
    </>
  );
  return overview;
}
export function SettingsPage() {
  const { t, locale, language } = useI18n();
  const { notify, refresh } = useKuka(),
    [password, setPassword] = useState(''),
    [restorePassword, setRestorePassword] = useState(''),
    [error, setError] = useState(''),
    [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null),
    [showCode, setShowCode] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    navigator.storage
      ?.estimate()
      .then((s) => setStorage({ usage: s.usage ?? 0, quota: s.quota ?? 0 }))
      .catch(() => setStorage(null));
  }, []);
  return (
    <>
      <PageTitle
        eyebrow={t('This device')}
        title={t('Settings, sync & recovery')}
        description={t(
          'Synchronize records, download a backup, or save your recovery code before changing devices.',
        )}
      />
      <section id="sync" className="settings-sync">
        <SyncCenter />
      </section>
      <div className="dashboard-grid">
        <Panel title={t('Encrypted backup & restore')}>
          <h3>{t('Save a backup')}</h3>
          <label>
            {t('Backup passphrase (at least 10 characters)')}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={10}
              autoComplete="new-password"
            />
          </label>
          <div className="button-row">
            <button
              className="button primary"
              disabled={password.length < 10 || busy}
              onClick={async () => {
                setError('');
                setBusy(true);
                try {
                  download('smriva-encrypted-backup.json', await vault.export(password));
                  notify(t('Encrypted backup exported. Keep the passphrase separately.'));
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Download size={16} /> {t('Export backup')}
            </button>
          </div>
          <h3>{t('Restore from another device')}</h3>
          <p className="fine" id="backup-restore-help">
            {t(
              'Use the backup passphrase chosen when the file was exported. Your device PIN can be different. Restore adds records to this workspace; it keeps your existing records.',
            )}
          </p>
          <label>
            {t('Backup passphrase used when exporting this file')}
            <input
              type="password"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              autoComplete="off"
              aria-describedby="backup-restore-help"
            />
          </label>
          <div className="button-row">
            <label
              className={'button outline file-button ' + (!restorePassword.length || busy ? 'disabled' : '')}
            >
              <Upload size={16} /> {t('Import backup')}
              <input
                type="file"
                accept=".json,application/json"
                disabled={!restorePassword.length || busy}
                onChange={async (e) => {
                  const input = e.currentTarget;
                  const file = input.files?.[0];
                  if (!file) return;
                  setError('');
                  setBusy(true);
                  try {
                    const n = await vault.import(await readBackupFile(file), restorePassword);
                    refresh();
                    notify(t('{count} validated operations restored locally', { count: n }));
                  } catch (e: any) {
                    setError(e.message);
                  } finally {
                    setBusy(false);
                    input.value = '';
                  }
                }}
              />
            </label>
          </div>
          <p className="fine">
            {t(
              'AES-256-GCM with an independent PBKDF2-derived backup key. The backup contains operations, not your hub credentials.',
            )}
          </p>
          <Notice>
            {t(
              'Unsynchronized records on a lost device cannot be recovered unless you exported a backup. Keep a backup before replacing a device.',
            )}
          </Notice>
          {error && <Notice tone="coral">{t(error)}</Notice>}
        </Panel>
        <Panel title={t('Device identity')}>
          <dl className="detail-list">
            <div>
              <dt>{t('Name / role')}</dt>
              <dd>
                {vault.state!.identity.actorId} · {t(displayRole(vault.state!.identity.role))}
              </dd>
            </div>
            <div>
              <dt>{t('Device')}</dt>
              <dd className="code-line">{vault.state!.identity.deviceId}</dd>
            </div>
            <div>
              <dt>{t('Offline session expires')}</dt>
              <dd>{new Date(vault.state!.identity.expires).toLocaleString(locale)}</dd>
            </div>
            <div>
              <dt>{t('Storage')}</dt>
              <dd>
                {storage
                  ? t('{used} used / {quota} available quota', {
                      used: bytes(storage.usage),
                      quota: bytes(storage.quota),
                    })
                  : t('Checking…')}
              </dd>
            </div>
            <div>
              <dt>{t('Local lock')}</dt>
              <dd>{t('15 minutes of inactivity')}</dd>
            </div>
          </dl>
          <button
            className="button outline"
            onClick={() => {
              vault.lock();
              refresh();
            }}
          >
            <LockKeyhole size={16} /> {t('Lock workspace now')}
          </button>
          <button
            className="button outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const expires = await vault.renewSession();
                refresh();
                notify(
                  t('Online session verified. Offline access renewed until {date}', {
                    date: new Date(expires).toLocaleDateString(locale),
                  }),
                );
              } catch (e: any) {
                setError(e.message);
                notify(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {t('Renew offline session online')}
          </button>
        </Panel>
        <Panel title={t('Recovery code')}>
          <p>
            {t(
              'Store this code somewhere safe. Anyone holding it can recover your synchronized demo workspace on a fresh device. Recovery revokes the previous device.',
            )}
          </p>
          <button className="button outline" onClick={() => setShowCode(!showCode)}>
            {t(showCode ? 'Hide recovery code' : 'Reveal recovery code')}
          </button>
          {showCode && <code className="recovery-code">{vault.state!.identity.recovery}</code>}
          <p className="fine">
            {t(
              'An offline revoked device can still unlock until it reconnects. New uploads from revoked devices are rejected or quarantined.',
            )}
          </p>
          <Link className="text-link" to="/recover">
            {t('Open recovery on a new device')} <ArrowRight size={15} />
          </Link>
        </Panel>
        <Panel title={t('Transfer by USB')}>
          <p>
            {t(
              'Export a signed, encrypted hub bundle for USB transfer between hubs that share a trust key. Hub access is needed to create or ingest the bundle.',
            )}
          </p>
          <div className="button-row">
            <button
              className="button outline"
              onClick={async () => {
                try {
                  download('smriva-signed-hub-bundle.json', await vault.request('bundle'));
                  notify(t('Signed encrypted hub bundle exported'));
                } catch (e: any) {
                  setError(e.message);
                }
              }}
            >
              <Download size={15} /> {t('Export hub bundle')}
            </button>
            <label className="button outline file-button">
              <Upload size={15} /> {t('Import at hub')}
              <input
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const result = await vault.request('bundle', JSON.parse(await file.text()));
                    notify(t('{count} operations ingested idempotently', { count: result.accepted.length }));
                  } catch (e: any) {
                    setError(e.message);
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>
          <p className="fine">
            {t('Signature: HMAC-SHA-256. Payload: AES-GCM. A foreign hub key is rejected.')}
          </p>
        </Panel>
      </div>
    </>
  );
}
export { default as Admin } from './HubAdmin';
export function About() {
  const [indicator, setIndicator] = useState<any>(null);
  useEffect(() => {
    fetch('/education-snapshot.json')
      .then((r) => (r.ok ? r.json() : null))
      .then(setIndicator)
      .catch(() => {});
  }, []);
  return (
    <main className="about-page" lang="en">
      <a className="brand" href="/">
        <Bird size={45} />
        <strong>Smriva</strong>
      </a>
      <PageTitle
        eyebrow="Project notes"
        title="About this build"
        description="An offline-first prototype for education. Built at BIOS V2. No affiliation or deployment claims."
      />
      <Panel title="What this build does">
        <p>
          Every local write commits an encrypted operation log to IndexedDB before the interface confirms it.
          The shared service uses SQLite transactions, immutable operation IDs, bounded delta batches, durable
          cursors, authenticated device sessions, and encrypted storage.
        </p>
        <p>
          Critical fields use multi-value registers with causal ancestry. Tags use observed-remove semantics;
          assessment attempts are append-only sets. Stock deltas use an idempotent operation-based counter.
          These implementations are exercised by property and integration tests.
        </p>
      </Panel>
      <Panel title="Sources & original content">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>RESOURCE</th>
                <th>PROVIDER</th>
                <th>USE / LICENCE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Bird and interface artwork</td>
                <td>Smriva project</td>
                <td>Original SVG / CSS · CC BY 4.0</td>
              </tr>
              <tr>
                <td>
                  <External href="https://learningequality.org/kolibri/about-kolibri/">Kolibri</External>
                </td>
                <td>Learning Equality</td>
                <td>Architecture reference only · no media copied</td>
              </tr>
              <tr>
                <td>
                  <External href="https://diksha.gov.in/">DIKSHA</External>
                </td>
                <td>Government of India</td>
                <td>Website content online · attributed programme banner bundled separately</td>
              </tr>
              <tr>
                <td>Six official programme reference images</td>
                <td>Ministry of Education</td>
                <td>Unchanged, with acknowledgement under the respective website reproduction policies</td>
              </tr>
              <tr>
                <td>
                  <External href="https://phet.colorado.edu/en/offline-access">PhET</External>
                </td>
                <td>University of Colorado Boulder</td>
                <td>External guide · no simulations redistributed</td>
              </tr>
              <tr>
                <td>
                  <External href="https://data.worldbank.org/indicator/SE.ADT.LITR.ZS?locations=IN">
                    Adult literacy, India
                  </External>
                </td>
                <td>World Bank / UNESCO UIS</td>
                <td>CC BY 4.0, subject to metadata</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="fine">
          Government images retain their original ownership and are separate from Smriva's CC BY artwork. See
          the{' '}
          <External href="https://www.dsel-education.gov.in/policies/copyright-policy">
            education image policy
          </External>
          . Source credits are shown with each programme under Government schemes. No government endorsement
          of Smriva is implied.
        </p>
      </Panel>
      <Panel title="National education context · separate from demo children">
        {indicator?.observations?.length ? (
          indicator.observations.map((o: any) => (
            <div className="integration-row" key={o.indicator}>
              <div>
                <strong>
                  {o.title} · {o.value.toFixed(2)}
                  {o.unit}
                </strong>
                <p>
                  India · observation {o.year} · retrieved {indicator.retrievedAt}
                </p>
                <External href={o.source}>Source & metadata</External>
              </div>
            </div>
          ))
        ) : (
          <p className="muted">
            A verified national-data snapshot is not available. No statistics have been substituted. Run npm
            run data:fetch with internet access.
          </p>
        )}
      </Panel>
      <Panel title="Threat model & deployment limits">
        <p>
          A locked device stores encrypted records and a wrapped random data key. PIN-derived keys use PBKDF2
          with a unique salt, and AES-GCM uses random nonces. A short PIN remains susceptible to offline
          guessing. Encryption does not protect an unlocked workspace from malicious JavaScript.
        </p>
        <p>
          Judge enrollment is deliberately open. Controlled enrollment through first-admin bootstrap and
          role-bound invitations is implemented. External identity-provider login, field-specific read
          permissions, district peer replication, Merkle repair trees and external integrations are not
          completed. Workspace controls are available in English, Hindi and Punjabi; source documentation and
          raw technical logs remain English. Do not deploy this demo with real personal data.
        </p>
        <p>
          The hub encrypts operation bodies with an environment key. Database indexes expose operation IDs,
          school IDs, device IDs, and metadata. HTTPS, data-protection review, hardened identity, and a
          managed key store are required for real deployments.
        </p>
        <p>
          Unsynchronized work without a backup cannot be recovered after device loss. Signed bundles require
          the same trusted hub key. A SHA-256 log digest proves equal logs when compared; it does not
          independently prove record correctness.
        </p>
      </Panel>
      <div className="button-row">
        <Link className="button primary" to="/app/today">
          Open workspace <ArrowRight size={16} />
        </Link>
        <Link className="button outline" to="/lab">
          Inspect the resilience lab
        </Link>
      </div>
    </main>
  );
}
