import { useI18n } from '../lib/i18n';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  FileClock,
  KeyRound,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { hub } from '../lib/hub';
import { newId, submitForm } from '../lib/platform';
import { useKuka } from '../lib/context';
import { vault } from '../lib/vault';
import { localDate } from '../lib/entry';
import { displayRole } from '../lib/presentation';
import { Badge, bytes, Empty, Notice, PageTitle, Panel } from '../components/UI';
import { ChildCreateSchema, ChildUpdateSchema } from '../../../../packages/sync-core/src/domain';
import type { Field } from '../../../../packages/sync-core/src/policy';

type ChildRecord = Record<string, any> & { id: string };
type RecordRow = { record: ChildRecord; version: string; updatedAt: number };
type ChildPage = { records: RecordRow[]; total: number; offset: number; limit: number };
type DatabaseInfo = {
  schemaVersion: number;
  engine: string;
  counts: {
    operations: number;
    children: number;
    records: number;
    conflicts: number;
    quarantined: number;
    devices: number;
  };
  storageBytes: number;
};
type Device = {
  id: string;
  actor: string;
  role: string;
  expires: number;
  revoked: number | null;
  last_seen: number | null;
};
type AuditEvent = { id: number; device: string; event: string; time: number; details: unknown };
type Quarantined = { opId: string; reason: string; operation: Record<string, any> };
type Invitation = { code: string; role: string; expires: number; schoolId: string };
type ChildForm = {
  name: string;
  dob: string;
  class: string;
  village: string;
  guardian: string;
  phone: string;
  consent: boolean;
};
type Tab = 'Database' | 'Devices' | 'Enrollment' | 'Audit' | 'Quarantine';
const tabs: { name: Tab; Icon: typeof Database }[] = [
  { name: 'Database', Icon: Database },
  { name: 'Devices', Icon: Smartphone },
  { name: 'Enrollment', Icon: KeyRound },
  { name: 'Audit', Icon: FileClock },
  { name: 'Quarantine', Icon: ShieldAlert },
];
const blankForm = (): ChildForm => ({
  name: '',
  dob: '',
  class: 'Class 1',
  village: 'Daun Kalan',
  guardian: '',
  phone: '',
  consent: false,
});
const dateTime = (value: number | null | undefined, locale?: string) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0
    ? new Date(value).toLocaleString(locale)
    : 'Not recorded';
const errorText = (error: unknown) => {
  const issues = (error as any)?.issues;
  if (Array.isArray(issues))
    return issues.map((issue: any) => [issue.path?.join('.'), issue.message].filter(Boolean).join(': ')).join('; ');
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|networkerror|load failed|network request/i.test(message)
    ? 'The remote service is unreachable. Your form is still here; reconnect and retry. Use the Children or Classroom page for offline entry.'
    : message;
};
const normalized = (form: ChildForm) => ({
  name: form.name.trim(),
  dob: form.dob,
  class: form.class.trim(),
  village: form.village.trim(),
  guardian: form.guardian.trim(),
  phone: form.phone.trim(),
  consent: form.consent,
});
const deviceChildren = (query: string, offset: number, limit: number): ChildPage => {
  const search = query.trim().toLocaleLowerCase(),
    operations = vault.state?.ops ?? [],
    records = Object.values(vault.view.entities)
      .filter((record: any) => record.type === 'child')
      .filter((record: any) =>
        search
          ? [record.id, record.name, record.class, record.village, record.guardian, record.phone].some(
              (value) => String(value ?? '').toLocaleLowerCase().includes(search),
            )
          : true,
      )
      .map((record: any) => {
        const recordOps = operations.filter((operation) => operation.entityId === record.id);
        return {
          record,
          version: 'device/' + recordOps.length,
          updatedAt: Math.max(0, ...recordOps.map((operation) => operation.hlc.physical)),
        };
      })
      .sort((a, b) => String(a.record.name ?? a.record.id).localeCompare(String(b.record.name ?? b.record.id)));
  return { records: records.slice(offset, offset + limit), total: records.length, offset, limit };
};
const deviceDatabaseInfo = (): DatabaseInfo => {
  const view = vault.view,
    state = vault.state!;
  return {
    schemaVersion: 1,
    engine: 'Encrypted IndexedDB',
    counts: {
      operations: view.operations,
      children: Object.values(view.entities).filter((record: any) => record.type === 'child').length,
      records: Object.keys(view.entities).length,
      conflicts: view.conflicts.length,
      quarantined: state.quarantined.length,
      devices: 1,
    },
    storageBytes: new Blob([JSON.stringify(state)]).size,
  };
};

export default function HubAdmin() {
  const { t, locale } = useI18n();
  const { sync, notify } = useKuka();
  const identity = vault.state?.identity;
  const isAdmin = identity?.role === 'Hub Admin';
  const canReview = isAdmin || identity?.role === 'Reviewer';
  const [tab, setTab] = useState<Tab>('Database');
  const [info, setInfo] = useState<DatabaseInfo | null>(null);
  const [page, setPage] = useState<ChildPage | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(25);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [editor, setEditor] = useState<'new' | RecordRow | null>(null);
  const [form, setForm] = useState<ChildForm>(blankForm);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [quarantine, setQuarantine] = useState<Quarantined[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [inviteRole, setInviteRole] = useState('Teacher');
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const keys = useRef(new Map<string, string>());
  const createDraft = useRef<ChildForm>(blankForm());
  const formPanel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (editor === 'new') createDraft.current = form;
  }, [editor, form]);

  const mutate = useCallback(async (scope: string, path: string, body: unknown, method = 'POST') => {
    let idempotencyKey = keys.current.get(scope);
    if (!idempotencyKey) {
      idempotencyKey = newId();
      keys.current.set(scope, idempotencyKey);
    }
    const result = await hub(path, { method, body, idempotencyKey });
    keys.current.delete(scope);
    return result;
  }, []);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    const load = async () => {
      try {
        if (tab === 'Database') {
          if (current) {
            setInfo(deviceDatabaseInfo());
            setPage(deviceChildren(query, offset, limit));
          }
        } else if (tab === 'Devices') {
          const result = await hub('devices');
          if (current) setDevices(result.devices);
        } else if (tab === 'Audit' && canReview) {
          const result = await hub('admin/audit');
          if (current) setEvents(result.events);
        } else if (tab === 'Quarantine' && canReview) {
          const result = await hub('admin/quarantine');
          if (current) setQuarantine(result.items);
        }
      } catch (error) {
        if (current) setError(errorText(error));
      } finally {
        if (current) setLoading(false);
      }
    };
    void load();
    return () => {
      current = false;
    };
  }, [tab, query, offset, limit, revision, canReview]);

  const refresh = () => setRevision((value) => value + 1);
  const openNew = () => {
    setEditor('new');
    setForm(keys.current.has('create-child') ? createDraft.current : blankForm());
    setError('');
    setSaved('');
    requestAnimationFrame(() => {
      formPanel.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      formPanel.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    });
  };
  const openEdit = (row: RecordRow) => {
    if (row.record.hasConflict || row.record.deleted) return;
    setForm({
      name: row.record.name ?? '',
      dob: row.record.dob ?? '',
      class: row.record.class ?? '',
      village: row.record.village ?? '',
      guardian: row.record.guardian ?? '',
      phone: row.record.phone ?? '',
      consent: row.record.consent === true,
    });
    setEditor(row);
    setError('');
    setSaved('');
    requestAnimationFrame(() => {
      formPanel.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
      formPanel.current?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    });
  };
  const afterLocalSave = async (message: string) => {
    setSaved(t(message));
    notify(t(message));
    refresh();
    if (!navigator.onLine) return;
    try {
      await sync();
    } catch {
      setSaved(t(message) + ' ' + t('The hub copy is still pending; retry in Sync center.'));
    }
  };
  const saveChild = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editor || busy) return;
    setBusy('child');
    setError('');
    setSaved('');
    try {
      const values = normalized(form);
      if (values.name.length < 2 || !values.class || values.village.length < 2)
        throw new Error('Enter a child name, class, and village.');
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(values.dob) ||
        !Number.isFinite(Date.parse(values.dob)) ||
        new Date(values.dob).toISOString().slice(0, 10) !== values.dob ||
        values.dob > localDate()
      )
        throw new Error('Enter a valid date of birth that is not in the future.');
      if (editor === 'new' && !values.consent)
        throw new Error('Shared-record consent must be confirmed before creating a record.');
      if (editor === 'new') {
        const record = ChildCreateSchema.parse(values),
          id = 'child-' + newId();
        await vault.writeMany(
          Object.entries(record).map(([field, value]) => ({ entityId: id, field: field as Field, value })),
        );
      } else {
        const changes: Record<string, unknown> = {};
        for (const [field, value] of Object.entries(values)) {
          if (value !== (editor.record[field] ?? (typeof value === 'boolean' ? false : '')))
            changes[field] = value;
        }
        if (!Object.keys(changes).length) {
          setSaved('No changes to save.');
          return;
        }
        const record = ChildUpdateSchema.parse(changes);
        await vault.writeMany(
          Object.entries(record).map(([field, value]) => ({
            entityId: editor.record.id,
            field: field as Field,
            value,
          })),
        );
      }
      setEditor(null);
      setForm(blankForm());
      await afterLocalSave('Saved in the encrypted database on this device.');
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy('');
    }
  };
  const archiveOrRestore = async (row: RecordRow) => {
    const action = row.record.deleted ? 'restore' : 'archive';
    setBusy(action + ':' + row.record.id);
    setError('');
    setSaved('');
    try {
      await vault.write(
        row.record.id,
        'deleted',
        action === 'archive',
        action === 'archive' ? 'delete' : 'resurrect',
        'child',
      );
      await afterLocalSave(
        action === 'archive'
          ? 'Archived on this device. The record and its history are retained.'
          : 'Restored in the database on this device.',
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy('');
    }
  };
  const editorIsConflict = editor !== null && editor !== 'new' && editor.record.hasConflict;

  return (
    <>
      <PageTitle
        eyebrow={t('Administration')}
        title={t('Record database')}
        description={t('Browse and edit the encrypted records stored on this device, even while offline.')}
        action={
          <button className="button outline" onClick={refresh} disabled={loading || Boolean(busy)}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} /> {t('Refresh records')}
          </button>
        }
      />
      <Notice>
        {t(
          'The Database tab uses this device’s encrypted offline storage. Sync copies pending changes to remote backup. Devices, enrollment, audit, and quarantine still need a connection.',
        )}
      </Notice>
      <div className="tabs" role="tablist" aria-label={t('Hub administration')}>
        {tabs.map(({ name, Icon }) => (
          <button
            key={name}
            role="tab"
            aria-selected={tab === name}
            aria-controls={'hub-panel-' + name.toLowerCase()}
            id={'hub-tab-' + name.toLowerCase()}
            className={tab === name ? 'active' : ''}
            onClick={() => {
              setTab(name);
              setError('');
            }}
          >
            <Icon size={15} /> {t(name)}
          </button>
        ))}
      </div>
      {error && <Notice tone="coral">{t(error)}</Notice>}
      {saved && (
        <div role="status" className="inline-success">
          <CheckCircle2 size={16} />
          {t(saved)}
        </div>
      )}
      <div
        role="tabpanel"
        id={'hub-panel-' + tab.toLowerCase()}
        aria-labelledby={'hub-tab-' + tab.toLowerCase()}
      >
        {tab === 'Database' && (
          <>
            {info && (
              <>
                <div className="metrics">
                  {[
                    ['Children', info.counts.children],
                    ['Encrypted operations', info.counts.operations],
                    ['Unresolved conflicts', info.counts.conflicts],
                    ['Quarantined', info.counts.quarantined],
                  ].map(([label, value]) => (
                    <div className="metric" key={label}>
                      <div className="metric-top">
                        <span>{t(String(label))}</span>
                        <strong>{value}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="fine">
                  {t(
                    '{engine} · schema {schema} · {records} materialized records · {devices} enrolled devices · {storage} database storage',
                    {
                      engine: info.engine,
                      schema: info.schemaVersion,
                      records: info.counts.records,
                      devices: info.counts.devices,
                      storage: bytes(info.storageBytes),
                    },
                  )}
                </p>
              </>
            )}
            <div className="toolbar records-toolbar">
              <form
                className="search-field"
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery(search.trim());
                  setOffset(0);
                }}
              >
                <Search size={16} />
                <input
                  aria-label={t('Search database children')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('Search offline records…')}
                />
                <button className="button plain" type="submit">
                  {t('Search database')}
                </button>
              </form>
              <button className="button primary" onClick={openNew} disabled={Boolean(busy)}>
                <Plus size={16} /> {t('New database record')}
              </button>
            </div>
            {editor && (
              <section ref={formPanel}>
                <Panel
                  title={editor === 'new' ? 'New child record' : 'Edit child record'}
                  aside={
                    <button
                      className="icon-button"
                      aria-label={t('Close hub record editor')}
                      disabled={busy === 'child'}
                      onClick={() => setEditor(null)}
                    >
                      <X size={17} />
                    </button>
                  }
                >
                  {editorIsConflict ? (
                    <Notice tone="coral">
                      {t('This record has competing versions.')}{' '}
                      <Link to="/app/conflicts">{t('Review the alternatives in Conflict inbox')}</Link>{' '}
                      {t('before editing.')}
                    </Notice>
                  ) : (
                    <form
                      onSubmit={saveChild}
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                          e.preventDefault();
                          submitForm(e.currentTarget);
                        }
                      }}
                    >
                      <div className="form-grid">
                        <label>
                          {t('Child name *')}
                          <input
                            aria-label={t('Hub child name')}
                            required
                            minLength={2}
                            maxLength={80}
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            autoComplete="off"
                          />
                        </label>
                        <label>
                          {t('Date of birth *')}
                          <input
                            aria-label={t('Hub date of birth')}
                            type="date"
                            required
                            max={localDate()}
                            value={form.dob}
                            onChange={(e) => setForm({ ...form, dob: e.target.value })}
                          />
                        </label>
                      </div>
                      <div className="form-grid">
                        <label>
                          {t('Class *')}
                          <input
                            aria-label={t('Hub class')}
                            required
                            maxLength={80}
                            value={form.class}
                            onChange={(e) => setForm({ ...form, class: e.target.value })}
                            list="hub-classes"
                          />
                          <datalist id="hub-classes">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={'Class ' + n} />
                            ))}
                          </datalist>
                        </label>
                        <label>
                          {t('Village *')}
                          <input
                            aria-label={t('Hub village')}
                            required
                            minLength={2}
                            maxLength={100}
                            value={form.village}
                            onChange={(e) => setForm({ ...form, village: e.target.value })}
                          />
                        </label>
                      </div>
                      <div className="form-grid">
                        <label>
                          {t('Guardian')}
                          <input
                            aria-label={t('Hub guardian')}
                            maxLength={80}
                            value={form.guardian}
                            onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                          />
                        </label>
                        <label>
                          {t('Guardian phone')}
                          <input
                            aria-label={t('Hub phone')}
                            type="tel"
                            maxLength={40}
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          />
                        </label>
                      </div>
                      <label className="checkbox-label">
                        <input
                          aria-label={t('Hub shared-record consent')}
                          type="checkbox"
                          required={editor === 'new'}
                          checked={form.consent}
                          onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                        />{' '}
                        {t(
                          'Guardian consent confirmed for the shared health and education record. Enter synthetic details in this demonstration.',
                        )}
                      </label>
                      {editor !== 'new' && (
                        <p className="fine">
                          {t('Record ID:')}
                          <code>{editor.record.id}</code> {t('· version:')}
                          <code>{editor.version}</code>
                          {t('. A newer server version will reject this edit instead of overwriting it.')}
                        </p>
                      )}
                      <div className="form-actions">
                        <button className="button primary" type="submit" disabled={Boolean(busy)}>
                          {busy === 'child' ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}{' '}
                          {t(busy === 'child' ? 'Saving…' : 'Save on device')}
                        </button>
                        <button
                          className="button outline"
                          type="button"
                          disabled={busy === 'child'}
                          onClick={() => setEditor(null)}
                        >
                          {t('Cancel')}
                        </button>
                      </div>
                      <p className="fine">
                        {t(
                          'Ctrl+Enter saves to the encrypted database on this device. Synchronize when a hub connection is available.',
                        )}
                      </p>
                    </form>
                  )}
                </Panel>
              </section>
            )}
            <Panel
              title={
                page ? t('{count} offline child records', { count: page.total }) : t('Offline child records')
              }
              className="flush-panel"
              aside={
                loading ? (
                  <span className="fine no-margin">
                    <Loader2 size={13} className="spin" /> {t('Loading…')}
                  </span>
                ) : (
                  <span className="fine no-margin">{t('Includes archived records')}</span>
                )
              }
            >
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Child')}</th>
                      <th>{t('Class / village')}</th>
                      <th>{t('Updated on device')}</th>
                      <th>{t('Status')}</th>
                      <th>{t('Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {page?.records.map((row) => (
                      <tr key={row.record.id}>
                        <td>
                          <strong>{row.record.name ?? t('Identity needs review')}</strong>
                          <small>
                            <code>{row.record.id}</code>
                          </small>
                        </td>
                        <td>
                          {row.record.class ?? t('Needs review')}
                          <small>{row.record.village ?? t('Needs review')}</small>
                        </td>
                        <td>{t(dateTime(row.updatedAt, locale))}</td>
                        <td>
                          <Badge
                            tone={row.record.hasConflict ? 'coral' : row.record.deleted ? 'amber' : 'green'}
                          >
                            {row.record.hasConflict
                              ? 'Needs review'
                              : row.record.deleted
                                ? 'Archived'
                                : 'On device'}
                          </Badge>
                        </td>
                        <td>
                          <div className="button-row no-margin">
                            {row.record.hasConflict ? (
                              <Link className="button outline small-button" to="/app/conflicts">
                                {t('Review conflict')}
                              </Link>
                            ) : (
                              <>
                                {!row.record.deleted && (
                                  <button
                                    className="button outline small-button"
                                    aria-label={t('Edit {name} on device', {
                                      name: row.record.name ?? row.record.id,
                                    })}
                                    disabled={Boolean(busy)}
                                    onClick={() => openEdit(row)}
                                  >
                                    {t('Edit')}
                                  </button>
                                )}
                                <button
                                  className="button outline small-button"
                                  aria-label={t(
                                    row.record.deleted
                                      ? 'Restore {name} on device'
                                      : 'Archive {name} on device',
                                    { name: row.record.name ?? row.record.id },
                                  )}
                                  disabled={Boolean(busy)}
                                  onClick={() => void archiveOrRestore(row)}
                                >
                                  {row.record.deleted ? <RotateCcw size={13} /> : <Archive size={13} />}{' '}
                                  {t(row.record.deleted ? 'Restore' : 'Archive')}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!loading && page?.records.length === 0 && (
                <Empty
                  title={t('No offline child records found')}
                  description={t(
                    'Change the search or create a record. New entries are encrypted and saved on this device.',
                  )}
                />
              )}
            </Panel>
            {page && (
              <div className="toolbar">
                <span className="fine no-margin">
                  {t('{start}–{end} of {total}', {
                    start: page.total ? page.offset + 1 : 0,
                    end: Math.min(page.offset + page.records.length, page.total),
                    total: page.total,
                  })}
                </span>
                <label className="inline-field">
                  {t('Rows per page')}
                  <select
                    aria-label={t('Hub records per page')}
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setOffset(0);
                    }}
                  >
                    {[10, 25, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="button-row no-margin">
                  <button
                    className="button outline"
                    disabled={loading || page.offset === 0}
                    onClick={() => setOffset(Math.max(0, page.offset - page.limit))}
                  >
                    <ChevronLeft size={15} /> {t('Previous page')}
                  </button>
                  <button
                    className="button outline"
                    disabled={loading || page.offset + page.records.length >= page.total}
                    onClick={() => setOffset(page.offset + page.limit)}
                  >
                    {t('Next page')}
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {tab === 'Devices' && (
          <Panel title={t('Enrolled devices')} className="flush-panel">
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('Worker')}</th>
                    <th>{t('Device')}</th>
                    <th>{t('Last seen')}</th>
                    <th>{t('Session expires')}</th>
                    <th>{t('Status')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {devices?.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <strong>{device.actor}</strong>
                        <small>{t(displayRole(device.role))}</small>
                      </td>
                      <td>
                        <code>{device.id}</code>
                        {device.id === identity?.deviceId && <small>{t('This device')}</small>}
                      </td>
                      <td>{t(dateTime(device.last_seen, locale))}</td>
                      <td>{t(dateTime(device.expires, locale))}</td>
                      <td>
                        <Badge
                          tone={device.revoked ? 'coral' : device.expires < Date.now() ? 'amber' : 'green'}
                        >
                          {device.revoked ? 'Revoked' : device.expires < Date.now() ? 'Expired' : 'Active'}
                        </Badge>
                      </td>
                      <td>
                        {canReview && !device.revoked && device.id !== identity?.deviceId && (
                          <button
                            className="button outline small-button danger"
                            aria-label={t('Revoke device for {name}', { name: device.actor })}
                            disabled={Boolean(busy)}
                            onClick={async () => {
                              setBusy('revoke:' + device.id);
                              setError('');
                              try {
                                await mutate(
                                  'revoke:' + device.id,
                                  'devices/' + encodeURIComponent(device.id) + '/revoke',
                                  {},
                                );
                                setSaved(
                                  'Device revoked at hub. Existing offline copies cannot be remotely erased.',
                                );
                                refresh();
                              } catch (error) {
                                setError(errorText(error));
                              } finally {
                                setBusy('');
                              }
                            }}
                          >
                            {t('Revoke')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {loading && <p className="fine">{t('Loading enrolled devices…')}</p>}
            {!loading && devices?.length === 0 && (
              <Empty
                title={t('No devices returned')}
                description={t('Enroll a device through the authorized enrollment flow.')}
              />
            )}
            <p className="fine" style={{ padding: '0 16px 16px' }}>
              {t(
                'Revocation takes effect when a device reconnects. Accepted operations are retained. New uploads from a revoked source remain quarantined for review.',
              )}
            </p>
          </Panel>
        )}
        {tab === 'Enrollment' && (
          <Panel title={t('Enrollment invitations')}>
            {!isAdmin ? (
              <Notice>
                {t('Only an Administrator can create enrollment invitations. Your current role is')}{' '}
                {t(identity?.role ? displayRole(identity.role) : 'unavailable')}.
              </Notice>
            ) : (
              <>
                <p>
                  {t(
                    'Create a role-bound invitation for a worker’s first online enrollment. The issued code grants access to this school; share it through an approved channel.',
                  )}
                </p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setBusy('invite');
                    setError('');
                    try {
                      const result = await mutate('invitation', 'admin/invitations', {
                        role: inviteRole,
                        ttlHours: 24,
                      });
                      setInvitation(result as Invitation);
                      setSaved('Enrollment invitation created at hub.');
                    } catch (error) {
                      setError(errorText(error));
                    } finally {
                      setBusy('');
                    }
                  }}
                >
                  <label>
                    {t('New device role')}
                    <select
                      aria-label={t('Invitation role')}
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      disabled={Boolean(busy)}
                    >
                      {['Teacher', 'Health Worker', 'Reviewer', 'Hub Admin'].map((role) => (
                        <option key={role} value={role}>
                          {t(displayRole(role))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="button primary" disabled={Boolean(busy)} type="submit">
                    <KeyRound size={16} /> {t('Create enrollment invitation')}
                  </button>
                  <p className="fine">
                    {t(
                      'Requested lifetime: 24 hours. The server-returned expiration below is authoritative.',
                    )}
                  </p>
                </form>
                {invitation && (
                  <section>
                    <h3>{t('Issued invitation')}</h3>
                    <code className="recovery-code" data-testid="enrollment-code">
                      {invitation.code}
                    </code>
                    <dl className="detail-list">
                      <div>
                        <dt>{t('Role')}</dt>
                        <dd>{t(displayRole(invitation.role))}</dd>
                      </div>
                      <div>
                        <dt>{t('School')}</dt>
                        <dd>{invitation.schoolId}</dd>
                      </div>
                      <div>
                        <dt>{t('Expires')}</dt>
                        <dd>{t(dateTime(invitation.expires, locale))}</dd>
                      </div>
                    </dl>
                    <button
                      className="button outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(invitation.code);
                          notify(t('Enrollment code copied'));
                        } catch {
                          setError('Clipboard access was unavailable. Select and copy the code manually.');
                        }
                      }}
                    >
                      <Copy size={15} /> {t('Copy invitation code')}
                    </button>
                  </section>
                )}
              </>
            )}
          </Panel>
        )}
        {tab === 'Audit' && (
          <Panel title={t('Hub audit events')} className="flush-panel">
            {!canReview ? (
              <div style={{ padding: 16 }}>
                <Notice>
                  {t('A Community member or Administrator role is required to inspect the audit log.')}
                </Notice>
              </div>
            ) : (
              <>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t('Event')}</th>
                        <th>{t('Device')}</th>
                        <th>{t('Time')}</th>
                        <th>{t('Details')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events?.map((event) => (
                        <tr key={event.id}>
                          <td>
                            <strong lang="en">{event.event}</strong>
                            <small>{t('Event #{id}', { id: event.id })}</small>
                          </td>
                          <td>
                            <code>{event.device}</code>
                          </td>
                          <td>{t(dateTime(event.time, locale))}</td>
                          <td>
                            <details>
                              <summary>{t('View details')}</summary>
                              <pre
                                lang="en"
                                className="code-line"
                                style={{ whiteSpace: 'pre-wrap', maxWidth: 420 }}
                              >
                                {typeof event.details === 'string'
                                  ? event.details
                                  : JSON.stringify(event.details, null, 2)}
                              </pre>
                            </details>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loading && <p className="fine">{t('Loading audit events…')}</p>}
                {!loading && events?.length === 0 && (
                  <Empty
                    title={t('No audit events returned')}
                    description={t('New hub actions will be recorded here when they occur.')}
                  />
                )}
              </>
            )}
          </Panel>
        )}
        {tab === 'Quarantine' && (
          <Panel title={t('Preserved quarantined operations')}>
            {!canReview ? (
              <Notice>
                {t('A Community member or Administrator role is required to inspect quarantined data.')}
              </Notice>
            ) : (
              <>
                <Notice>
                  {t(
                    'Quarantine review records a note and retains the operation. This control does not release an operation, alter its timestamp, or silently apply it to a child record.',
                  )}
                </Notice>
                {loading && <p className="fine">{t('Loading quarantined operations…')}</p>}
                {quarantine?.map((item) => (
                  <section key={item.opId} className="panel">
                    <div className="panel-heading">
                      <h3>
                        <code>{item.opId}</code>
                      </h3>
                      <Badge tone="amber">{t('Retained in quarantine')}</Badge>
                    </div>
                    <p>{item.reason}</p>
                    <dl className="detail-list">
                      <div>
                        <dt>{t('Record / field')}</dt>
                        <dd>
                          {item.operation.entityId} / {item.operation.field}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('Author')}</dt>
                        <dd>{item.operation.actorId}</dd>
                      </div>
                      <div>
                        <dt>{t('Device')}</dt>
                        <dd>
                          <code>{item.operation.deviceId}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>{t('Claimed operation time')}</dt>
                        <dd>{t(dateTime(item.operation.hlc?.physical, locale))}</dd>
                      </div>
                    </dl>
                    <details>
                      <summary>{t('Inspect preserved operation')}</summary>
                      <pre lang="en" className="code-line" style={{ whiteSpace: 'pre-wrap' }}>
                        {JSON.stringify(item.operation, null, 2)}
                      </pre>
                    </details>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        setBusy('quarantine:' + item.opId);
                        setError('');
                        try {
                          await mutate(
                            'quarantine:' + item.opId,
                            'admin/quarantine/' + encodeURIComponent(item.opId) + '/review',
                            { decision: 'retain', note: notes[item.opId]?.trim() },
                          );
                          setSaved('Review note saved at hub. The operation remains in quarantine.');
                          setNotes((current) => ({ ...current, [item.opId]: '' }));
                          refresh();
                        } catch (error) {
                          setError(errorText(error));
                        } finally {
                          setBusy('');
                        }
                      }}
                    >
                      <label>
                        {t('Review note')}
                        <textarea
                          aria-label={t('Review note for {id}', { id: item.opId })}
                          minLength={3}
                          maxLength={1000}
                          required
                          value={notes[item.opId] ?? ''}
                          onChange={(e) => setNotes({ ...notes, [item.opId]: e.target.value })}
                        />
                      </label>
                      <button type="submit" className="button outline" disabled={Boolean(busy)}>
                        <ShieldCheck size={15} /> {t('Save note and retain')}
                      </button>
                    </form>
                  </section>
                ))}
                {!loading && quarantine?.length === 0 && (
                  <Empty
                    title={t('No quarantined operations')}
                    description={t(
                      'Clock and revoked-device checks preserve rejected submissions here for authorized review.',
                    )}
                  />
                )}
              </>
            )}
          </Panel>
        )}
      </div>
    </>
  );
}
