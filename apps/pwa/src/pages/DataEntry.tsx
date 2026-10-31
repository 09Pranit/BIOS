import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Upload,
  Check,
  Users,
  Heart,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Circle,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  GitBranch,
  Filter,
  ChevronRight,
  ChevronDown,
  FilePlus2,
  LockKeyhole,
} from 'lucide-react';
import { formatDisplayDate, languages, useI18n, type Language } from '../lib/i18n';
import { useKuka } from '../lib/context';
import EasyDashboard from '../components/EasyDashboard';
import { displayRole } from '../lib/presentation';
import { vault } from '../lib/vault';
import { newId } from '../lib/platform';
import {
  PageTitle,
  Panel,
  Badge,
  Notice,
  Modal,
  Empty,
  initials,
  time,
  Form,
  Submit,
} from '../components/UI';
import { ChildForm } from './Workspace';
import { compareOpsByClock } from '../../../../packages/sync-core/src/index';
import {
  localDate,
  grades,
  matchesChild,
  parseScore,
  parseRoster,
  rosterKey,
  downloadCSV,
  type RosterRow,
} from '../lib/entry';
const childrenOnDevice = () =>
  Object.values(vault.view.entities)
    .filter((c) => c.type === 'child' && !c.deleted && !c.id.startsWith('lab-'))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
const states = ['present', 'absent', 'late', 'excused'] as const;
const restoredScores = () =>
  Object.fromEntries(
    Object.entries(vault.state?.entryDrafts ?? {})
      .filter(([key]) => key.startsWith('score|'))
      .map(([key, value]) => [key.slice(6), value]),
  );
const titleCase = (s: string) => s[0].toUpperCase() + s.slice(1);
function entryError(message: string, t: (text: string, values?: Record<string, string | number>) => string) {
  const rowError = /^Row (\d+): (.+)$/.exec(message);
  return rowError ? t('Row {row}: {message}', { row: rowError[1], message: t(rowError[2]) }) : t(message);
}
function SearchField({
  value,
  onChange,
  label = 'Search children',
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  const { t, locale } = useI18n();
  const { easyMode } = useKuka();
  return (
    <label className="search-field">
      <Search size={16} />
      <input
        aria-label={t(label)}
        placeholder={easyMode ? t('Type a name or village…') : t('Search name, ID, village…')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label={t('Clear search')}
          className="icon-button"
          onClick={() => onChange('')}
        >
          ×
        </button>
      )}
    </label>
  );
}
function ClassFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t, locale } = useI18n();
  return (
    <select aria-label={t('Class')} value={value} onChange={(e) => onChange(e.target.value)}>
      {['All classes', ...grades].map((g) => (
        <option key={g} value={g}>
          {t(g)}
        </option>
      ))}
    </select>
  );
}
export function Today() {
  const { t, locale } = useI18n();
  const { version, status, lens, easyMode } = useKuka(),
    children = childrenOnDevice(),
    s = vault.state!,
    entities = vault.view.entities,
    conflicts = vault.view.conflicts;
  const marked = children.filter((c) => entities[c.id + ':' + localDate()]?.attendance !== undefined).length;
  const draftCount = Object.keys(s.entryDrafts ?? {}).filter((key) => key.startsWith('score|')).length;
  const recent = s.ops
    .filter((o) => o.deviceId !== 'seed' && !o.entityId.startsWith('lab-'))
    .slice()
    .sort(compareOpsByClock)
    .reverse()
    .slice(0, 8);
  if (easyMode) return <EasyDashboard />;
  return (
    <>
      <PageTitle
        eyebrow={t('Dhareri village hub')}
        title={t('Overview')}
        description={t('Attendance, child records and health visits for this hub.')}
        action={
          <Link className="button primary" to="/app/children?new=1">
            <Plus size={16} /> {t('New child')}{' '}
          </Link>
        }
      />
      <div className="entry-shortcuts">
        <Link className="button primary" to="/app/school">
          <GraduationCap size={16} /> {t('Record attendance')}{' '}
        </Link>
        <Link className="button outline" to="/app/school?tab=assessments">
          {t('Enter assessment scores')}{' '}
        </Link>
        <Link className="button outline" to="/app/health">
          <Heart size={16} /> {t('Add health record')}{' '}
        </Link>
        <span className="shortcut-note">{t('All entries save locally before syncing.')}</span>
      </div>
      <div className="overview-layout">
        <div>
          <Panel
            title={t('To do today')}
            aside={<span className="fine no-margin">{formatDisplayDate(new Date(), locale)}</span>}
            className="flush-panel"
          >
            <div className="work-queue">
              {draftCount > 0 && (
                <Link to="/app/school?tab=assessments">
                  <GraduationCap size={18} />
                  <span>
                    <strong>{t('Assessment drafts')}</strong>
                    <small>{t('Your unfinished marks are saved here. Open them to continue.')}</small>
                  </span>
                  <span className="counter">{draftCount}</span>
                  <ChevronRight size={16} />
                </Link>
              )}
              <Link to="/app/school">
                <GraduationCap size={18} />
                <span>
                  <strong>{t('Attendance')}</strong>
                  <small>
                    {t('{marked} of {total} children marked for today', {
                      marked,
                      total: children.length,
                    })}{' '}
                  </small>
                </span>
                <span className="counter">{t('{count} remaining', { count: children.length - marked })}</span>
                <ChevronRight size={16} />
              </Link>
              <Link to="/app/conflicts">
                <ShieldCheck size={18} />
                <span>
                  <strong>{t('Conflicts to review')}</strong>
                  <small>{t('Compare competing entries and record a decision')}</small>
                </span>
                <span className={'counter ' + (conflicts.length ? 'review-count' : '')}>
                  {conflicts.length}
                </span>
                <ChevronRight size={16} />
              </Link>
              <Link to="/app/sync">
                <RefreshCw size={18} />
                <span>
                  <strong>{t('Pending sync')}</strong>
                  <small>{t('Saved here. Still waiting for a copy at the hub.')}</small>
                </span>
                <span className="counter">{vault.pending.length}</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </Panel>
          <Panel
            title={t('Recent changes')}
            aside={
              <Link className="text-link" to="/app/sync">
                {t('View operation ledger')}{' '}
              </Link>
            }
            className="flush-panel"
          >
            {recent.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t('Record')}</th>
                      <th>{t('Change')}</th>
                      <th>{t('Author')}</th>
                      <th>{t('Saved')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((o) => (
                      <tr key={o.opId}>
                        <td>
                          <Link
                            to={
                              o.entityType === 'lesson'
                                ? '/app/library'
                                : '/app/children/' + o.entityId.split(':')[0]
                            }
                          >
                            {entities[o.entityId]?.name ??
                              entities[o.entityId.split(':')[0]]?.name ??
                              o.entityId}
                          </Link>
                          <small>{o.entityId}</small>
                        </td>
                        <td>
                          <code>{o.field}</code>
                          <small>
                            {o.kind}{' '}
                            {typeof o.value === 'string' || typeof o.value === 'number'
                              ? String(o.value)
                              : ''}
                          </small>
                        </td>
                        <td>{o.actorId}</td>
                        <td className="nowrap">{time(o.hlc.physical, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="plain-empty">
                <GitBranch size={22} />
                <p>{t('No new changes on this workspace.')}</p>
                <small>{t('Start with attendance, a child record, or a health visit.')}</small>
              </div>
            )}
          </Panel>
          <Panel
            title={t('Children')}
            aside={
              <Link className="text-link" to="/app/children">
                {t('View all {count}', { count: children.length })}
              </Link>
            }
            className="flush-panel"
          >
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('Name')}</th>
                    <th>{t('Class')}</th>
                    <th>{t('Village')}</th>
                    <th>{t('Record')}</th>
                  </tr>
                </thead>
                <tbody>
                  {children.slice(0, 6).map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={'/app/children/' + c.id}>{c.name ?? t('Identity needs review')}</Link>
                      </td>
                      <td>{t(c.class ?? 'Needs review')}</td>
                      <td>{c.village}</td>
                      <td>
                        <Badge tone={c.hasConflict ? 'coral' : 'green'}>
                          {c.hasConflict ? t('Needs review') : t('Ready')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
        <aside className="overview-aside">
          <section>
            <h2>{t('Workspace details')}</h2>
            <dl className="detail-list">
              <div>
                <dt>{t('Hub')}</dt>
                <dd>Dhareri</dd>
              </div>
              <div>
                <dt>{t('Children')}</dt>
                <dd>{children.length}</dd>
              </div>
              <div>
                <dt>{t('Worker')}</dt>
                <dd>{s.identity.actorId}</dd>
              </div>
              <div>
                <dt>{t('Role')}</dt>
                <dd>{t(displayRole(s.identity.role))}</dd>
              </div>
              <div>
                <dt>{t('Connection')}</dt>
                <dd>{t(status)}</dd>
              </div>
              <div>
                <dt>{t('Hub backup')}</dt>
                <dd>{time(s.lastSync, locale)}</dd>
              </div>
            </dl>
          </section>
          <section>
            <h2>{t('Keyboard shortcuts')}</h2>
            <div className="shortcut-list">
              <span>
                <kbd>Ctrl K</kbd> {t('Search records and pages')}{' '}
              </span>
              <span>
                <kbd>P</kbd>
                <kbd>A</kbd>
                <kbd>L</kbd>
                <kbd>E</kbd> {t('Mark attendance')}{' '}
              </span>
              <span>
                <kbd>Enter</kbd> {t('Save score and move down')}{' '}
              </span>
              <span>
                <kbd>Ctrl Enter</kbd> {t('Submit form')}{' '}
              </span>
            </div>
          </section>
          <section>
            <h2>
              <LockKeyhole size={15} /> {t('Saved on this device')}{' '}
            </h2>
            <p>
              {t('{count} encrypted operations stored on this device. {pending} awaiting hub backup.', {
                count: s.ops.length,
                pending: vault.pending.length,
              })}{' '}
            </p>
            <Link className="text-link" to="/app/settings">
              {t('Backup and recovery')}{' '}
            </Link>
          </section>
        </aside>
      </div>
      {lens && (
        <Panel title={t('System details')}>
          <code className="code-line">
            {JSON.stringify({
              operations: s.ops.length,
              pending: vault.pending.length,
              cursor: s.cursor,
              conflicts: conflicts.length,
            })}
          </code>
        </Panel>
      )}
    </>
  );
}
function RosterImport({ close }: { close: () => void }) {
  const { t, locale } = useI18n();
  const { refresh, notify } = useKuka(),
    [rows, setRows] = useState<RosterRow[]>([]),
    [error, setError] = useState(''),
    [filename, setFilename] = useState(''),
    [busy, setBusy] = useState(false),
    [skip, setSkip] = useState(true),
    [consent, setConsent] = useState(false);
  const existing = new Set(childrenOnDevice().map(rosterKey)),
    matches = rows.filter((r) => existing.has(rosterKey(r))).length,
    accepted = rows.filter((r) => !skip || !existing.has(rosterKey(r)));
  return (
    <Modal title={t('Import child roster')} close={close}>
      <p className="muted">
        {t('Upload a CSV, review every row, then commit the import. Maximum 100 children per file.')}{' '}
      </p>
      <div className="button-row">
        <label className="button outline file-button">
          <Upload size={16} /> {t('Choose CSV')}{' '}
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setError('');
              setRows([]);
              setConsent(false);
              try {
                if (file.size > 250000)
                  throw new Error('File exceeds 250 KB. Import up to 100 rows at a time.');
                setRows(parseRoster(await file.text()));
                setFilename(file.name);
              } catch (err: any) {
                setError(err.message);
              }
              e.target.value = '';
            }}
          />
        </label>
        <button
          className="button plain"
          onClick={() =>
            downloadCSV('smriva-roster-template.csv', [
              ['name', 'dob', 'class', 'village', 'guardian', 'consent'],
              ['Example Child', '2019-04-15', 'Class 1', 'Dhareri', 'Example Guardian', 'true'],
            ])
          }
        >
          {t('Download template')}{' '}
        </button>
      </div>
      {error && <Notice tone="coral">{entryError(error, t)}</Notice>}
      {rows.length > 0 && (
        <>
          <div className="import-summary">
            <FileSpreadsheet size={17} />
            <strong>{filename}</strong>
            <span>{t('{count} validated rows', { count: rows.length })}</span>
          </div>
          <div className="table-scroll import-preview">
            <table>
              <thead>
                <tr>
                  <th>{t('Row')}</th>
                  <th>{t('Name')}</th>
                  <th>{t('Birth date')}</th>
                  <th>{t('Class')}</th>
                  <th>{t('Status')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>
                      {r.name}
                      <small>{r.village}</small>
                    </td>
                    <td>{r.dob}</td>
                    <td>{t(r.class)}</td>
                    <td>
                      {existing.has(rosterKey(r)) ? (
                        <Badge tone="amber">{t('Possible match')}</Badge>
                      ) : (
                        <Badge>{t('New record')}</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {matches > 0 && (
            <label className="checkbox-label">
              <input type="checkbox" checked={skip} onChange={(e) => setSkip(e.target.checked)} />{' '}
              {t(
                'Exclude {count} possible existing matches (same name, date of birth, and village). Uncheck to create separate child IDs. Existing records are never merged by this import.',
                { count: matches },
              )}{' '}
            </label>
          )}
          <label className="checkbox-label">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{' '}
            {t(
              'I have reviewed these synthetic records and confirmed guardian consent for every child included.',
            )}{' '}
          </label>
          <div className="form-actions">
            <button
              className="button primary"
              disabled={!consent || !accepted.length || busy}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  const changes = accepted.flatMap((row) => {
                    const id = 'child-' + newId();
                    return (['name', 'dob', 'class', 'village', 'guardian', 'consent'] as const).map(
                      (field) => ({ entityId: id, field, value: row[field] }),
                    );
                  });
                  await vault.writeMany(changes);
                  refresh();
                  notify(
                    t('{count} child records imported and saved on this device', { count: accepted.length }),
                  );
                  close();
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? t('Importing…') : t('Import {count} children', { count: accepted.length })}
            </button>
            <button className="button outline" onClick={close}>
              {t('Cancel')}{' '}
            </button>
          </div>
          <p className="fine">
            {t('All included records commit together in one encrypted local transaction.')}
          </p>
        </>
      )}
    </Modal>
  );
}
export function Children() {
  const { t, locale, language } = useI18n();
  const { version, easyMode } = useKuka(),
    children = childrenOnDevice(),
    [search, setSearch] = useState(''),
    [grade, setGrade] = useState('All classes'),
    [review, setReview] = useState('All records'),
    [sortLanguage, setSortLanguage] = useState<Language>(language),
    [params, setParams] = useSearchParams(),
    [add, setAdd] = useState<'student' | 'patient' | null>(null),
    [importing, setImporting] = useState(false);
  useEffect(() => {
    const requested = params.get('new');
    if (requested === 'student' || requested === 'patient') setAdd(requested);
    else if (requested === '1') setAdd('student');
  }, [params]);
  const close = () => {
    setAdd(null);
    if (params.has('new')) {
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
  };
  const sortLocale = languages.find((entry) => entry.code === sortLanguage)!.locale,
    shown = children
      .filter(
        (c) =>
          matchesChild(c, search) &&
          (grade === 'All classes' || c.class === grade) &&
          (review === 'All records' || c.hasConflict),
      )
      .sort((a, b) =>
        new Intl.Collator(sortLocale, { numeric: true, sensitivity: 'base' }).compare(
          a.name ?? a.id,
          b.name ?? b.id,
        ),
      );
  return (
    <>
      <PageTitle
        eyebrow={t('Dhareri village hub')}
        title={t('Children')}
        description={
          easyMode
            ? t('Find a child by name, or choose New child to add their details.')
            : t('Search, register, import, and correct child records.')
        }
        action={
          <div className="button-row no-margin">
            <button className="button outline" onClick={() => setImporting(true)}>
              <Upload size={16} /> {easyMode ? t('Add a list from a file') : t('Import CSV')}
            </button>
            <details className="new-menu">
              <summary className="button primary">
                <Plus size={16} /> {t('New')} <ChevronDown size={14} />
              </summary>
              <div className="new-menu-options">
                <button type="button" onClick={() => setAdd('student')}>
                  <GraduationCap size={15} /> {t('Student')}
                </button>
                <button type="button" onClick={() => setAdd('patient')}>
                  <Heart size={15} /> {t('Patient')}
                </button>
              </div>
            </details>
          </div>
        }
      />
      <div className="toolbar records-toolbar">
        <SearchField value={search} onChange={setSearch} />
        <ClassFilter value={grade} onChange={setGrade} />
        <select aria-label={t('Record status')} value={review} onChange={(e) => setReview(e.target.value)}>
          <option value="All records">{t('All records')}</option>
          <option value="Needs review">{t('Needs review')}</option>
        </select>
        <select
          aria-label={t('Sort names by language')}
          value={sortLanguage}
          onChange={(event) => setSortLanguage(event.target.value as Language)}
        >
          {languages.map(({ code, name }) => (
            <option key={code} value={code}>
              {t('Sort: {language}', { language: name })}
            </option>
          ))}
        </select>
        <button
          className="button outline"
          onClick={() =>
            downloadCSV('smriva-children.csv', [
              ['name', 'dob', 'class', 'village', 'guardian', 'consent'],
              ...shown.map((c) => [c.name, c.dob, c.class, c.village, c.guardian, c.consent]),
            ])
          }
        >
          <Download size={16} /> {easyMode ? t('Download list') : t('Export')}
        </button>
      </div>
      <Panel
        className="flush-panel"
        title={t('{count} children', { count: shown.length })}
        aside={
          <span className="fine no-margin">
            {t('{count} need review', { count: children.filter((c) => c.hasConflict).length })}
          </span>
        }
      >
        <div className="table-scroll">
          <table className="records-table">
            <thead>
              <tr>
                <th>{t('Child')}</th>
                <th>{t('Date of birth')}</th>
                <th>{t('Class')}</th>
                <th>{t('Village')}</th>
                <th>{t('Records')}</th>
                <th>{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link className="person-link" to={'/app/children/' + c.id}>
                      <Users size={16} />
                      <span>
                        <strong>{c.name ?? t('Identity needs review')}</strong>
                        <small>
                          {t(c.tags?.includes('patient') ? 'Patient' : 'Student')} · {c.id}
                        </small>
                      </span>
                    </Link>
                  </td>
                  <td>{c.dob ?? t('Review required')}</td>
                  <td>{t(c.class ?? 'Needs review')}</td>
                  <td>
                    {c.village}
                    <small>{c.guardian || t('No guardian recorded')}</small>
                  </td>
                  <td>
                    <span className="record-tags">
                      <span>
                        <GraduationCap size={13} /> {t('School')}{' '}
                      </span>
                      {c.visits?.length > 0 && (
                        <span>
                          <Heart size={13} /> {t('Health')}{' '}
                        </span>
                      )}
                    </span>
                  </td>
                  <td>
                    <Badge tone={c.hasConflict ? 'coral' : 'green'}>
                      {c.hasConflict ? t('Needs review') : t('Ready')}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!shown.length && (
          <Empty
            title={t('No matching children')}
            description={t('Change the filters or register a new child.')}
          />
        )}
      </Panel>
      {add && <ChildForm close={close} profile={add} />}
      {importing && <RosterImport close={() => setImporting(false)} />}
    </>
  );
}
export function School() {
  const { t, locale } = useI18n();
  const { version, write, refresh, notify, easyMode } = useKuka(),
    children = childrenOnDevice(),
    [params, setParams] = useSearchParams(),
    tab = params.get('tab') === 'assessments' ? 'Assessments' : 'Attendance',
    [date, setDate] = useState(localDate()),
    [grade, setGrade] = useState('All classes'),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('All children'),
    [selected, setSelected] = useState<Set<string>>(new Set()),
    [bulk, setBulk] = useState('present'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [assessment, setAssessment] = useState(vault.state?.entryDrafts?.['assessment-title'] ?? 'Number sense'),
    [attempt, setAttempt] = useState(vault.state?.entryDrafts?.['assessment-attempt'] ?? '1'),
    [drafts, setDrafts] = useState<Record<string, string>>(restoredScores),
    [scoreErrors, setScoreErrors] = useState<Record<string, string>>({}),
    [draftStatus, setDraftStatus] = useState<Record<string, string>>(() =>
      Object.fromEntries(Object.keys(restoredScores()).map((id) => [id, 'saved'])),
    );
  const table = useRef<HTMLTableElement>(null),
    draftRef = useRef<Record<string, string>>(drafts),
    draftPersists = useRef(0),
    inflight = useRef<Map<string, Promise<void>>>(new Map()),
    entities = vault.view.entities;
  const assessmentValid =
    Boolean(assessment.trim()) &&
    Number.isInteger(Number(attempt)) &&
    Number(attempt) >= 1 &&
    Number(attempt) <= 100;
  const recordId = (id: string) =>
    tab === 'Attendance' ? `${id}:${date}` : `${id}:${assessment.trim()}:attempt-${attempt}`;
  const base = children.filter(
    (c) => matchesChild(c, search) && (grade === 'All classes' || c.class === grade),
  );
  const rows = base.filter((c) => {
    const r = entities[recordId(c.id)];
    return (
      filter === 'All children' ||
      (filter === 'Unmarked' && r?.attendance === undefined) ||
      (filter === 'Needs review' && r?.hasConflict)
    );
  });
  const summary = states.map((state) => ({
    state,
    count: base.filter((c) => entities[`${c.id}:${date}`]?.attendance === state).length,
  }));
  const unmarked = base.filter((c) => entities[`${c.id}:${date}`]?.attendance === undefined).length;
  const selectedRows = rows.filter((c) => selected.has(c.id)),
    bulkRows = selectedRows.length
      ? selectedRows.filter((c) => !entities[`${c.id}:${date}`]?.hasConflict)
      : rows.filter((c) => entities[`${c.id}:${date}`]?.attendance === undefined);
  const focusRow = (index: number) => {
    table.current?.querySelectorAll<HTMLElement>('[data-entry-row]')[index]?.focus();
  };
  const mark = async (id: string, state: string, advance?: number) => {
    setError('');
    try {
      if (entities[`${id}:${date}`]?.hasConflict)
        throw new Error('Review this conflict in the Conflict inbox before changing it.');
      await write(`${id}:${date}`, 'attendance', state, 'set', 'attendance');
      if (advance !== undefined) focusRow(Math.min(advance, rows.length - 1));
    } catch (e: any) {
      setError(e.message);
    }
  };
  const rowKey = (e: KeyboardEvent<HTMLTableRowElement>, id: string, index: number) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.target as HTMLElement).tagName !== 'TR') return;
    const keys: Record<string, string> = { p: 'present', a: 'absent', l: 'late', e: 'excused' };
    if (keys[e.key.toLowerCase()]) {
      e.preventDefault();
      void mark(id, keys[e.key.toLowerCase()], index + 1);
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusRow(Math.max(0, Math.min(rows.length - 1, index + (e.key === 'ArrowDown' ? 1 : -1))));
    }
  };
  const setDraft = (id: string, value: string) => {
    draftRef.current = { ...draftRef.current, [id]: value };
    setDrafts(draftRef.current);
    setScoreErrors((s) => ({ ...s, [id]: '' }));
    setDraftStatus((s) => ({ ...s, [id]: 'saving' }));
    draftPersists.current++;
    void vault
      .saveEntryDrafts({
        'assessment-title': assessment,
        'assessment-attempt': attempt,
        ['score|' + id]: value,
      })
      .then(() => {
        if (draftRef.current[id] === value) setDraftStatus((s) => ({ ...s, [id]: 'saved' }));
        refresh();
      })
      .catch((e: any) => {
        setError(e.message);
        setDraftStatus((s) => ({ ...s, [id]: 'error' }));
      })
      .finally(() => {
        draftPersists.current--;
      });
  };
  const saveScore = async (id: string, advance?: number) => {
    const raw = draftRef.current[id];
    if (raw === undefined) return;
    try {
      if (!assessmentValid) throw new Error('Enter an assessment name and an attempt number from 1 to 100.');
      const score = parseScore(raw),
        entityId = recordId(id);
      if (entities[entityId]?.hasConflict)
        throw new Error('Resolve this score conflict before entering a correction.');
      const key = entityId + '|' + raw;
      let pending = inflight.current.get(key);
      if (!pending) {
        pending = (async () => {
          if (vault.view.entities[entityId]?.score !== score)
            await write(entityId, 'score', score, 'set', 'assessment');
          if (draftRef.current[id] === raw) {
            await vault.saveEntryDrafts({ ['score|' + id]: null });
            const next = { ...draftRef.current };
            delete next[id];
            draftRef.current = next;
            setDrafts(next);
          }
        })().finally(() => inflight.current.delete(key));
        inflight.current.set(key, pending);
      }
      await pending;
      inflight.current.delete(key);
      setScoreErrors((s) => ({ ...s, [id]: '' }));
      if (advance !== undefined) {
        const inputs = table.current?.querySelectorAll<HTMLInputElement>('input[data-score]');
        inputs?.[Math.min(advance, rows.length - 1)]?.focus();
        inputs?.[Math.min(advance, rows.length - 1)]?.select();
      }
    } catch (e: any) {
      setScoreErrors((s) => ({ ...s, [id]: e.message }));
    }
  };
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draftPersists.current > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);
  const chooseTab = (next: string) => {
    setParams(next === 'Assessments' ? { tab: 'assessments' } : {});
    setFilter('All children');
    setSelected(new Set());
    setError('');
  };
  return (
    <>
      <PageTitle
        eyebrow={t('Dhareri village hub')}
        title={t('Classroom')}
        description={
          easyMode
            ? t('Choose a class and fill in the rows. Each saved entry stays on this device, even offline.')
            : t('Enter attendance and scores. Changes commit to encrypted storage on this device.')
        }
      />
      <div className="tabs">
        {['Attendance', 'Assessments'].map((tabName) => (
          <button
            key={tabName}
            className={tab === tabName ? 'active' : ''}
            onClick={() => chooseTab(tabName)}
          >
            {t(tabName)}
          </button>
        ))}
      </div>
      <div className="entry-config">
        <ClassFilter value={grade} onChange={setGrade} />
        {tab === 'Attendance' ? (
          <label className="inline-field">
            {t('Date')}{' '}
            <input
              aria-label={t('Attendance date')}
              type="date"
              value={date}
              onChange={(e) => {
                if (e.target.value) setDate(e.target.value);
                setSelected(new Set());
              }}
              required
            />
          </label>
        ) : (
          <>
            <label className="inline-field">
              {t('Assessment')}{' '}
              <input
                aria-label={t('Assessment title')}
                value={assessment}
                disabled={Object.keys(drafts).length > 0}
                onChange={(e) => setAssessment(e.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label className="inline-field">
              {t('Attempt')}{' '}
              <input
                aria-label={t('Assessment attempt')}
                type="number"
                min="1"
                max="100"
                value={attempt}
                disabled={Object.keys(drafts).length > 0}
                onChange={(e) => setAttempt(e.target.value)}
              />
            </label>
          </>
        )}
        <span className="fine no-margin">
          {easyMode
            ? tab === 'Attendance'
              ? t('Choose a status for each child. Each choice saves immediately.')
              : t(
                  'Enter a score from 0 to 100, then select another row to save. Unfinished entries stay as drafts.',
                )
            : tab === 'Attendance'
              ? t('P / A / L / E on a focused row; ↑ ↓ to navigate.')
              : t('Enter saves and moves down. Unfinished inputs are kept as encrypted local drafts.')}
        </span>
      </div>
      {tab === 'Attendance' && (
        <div className="attendance-summary">
          {summary.map(({ state, count }) => (
            <span key={state}>
              <span className={'attendance-dot ' + state} />
              {t(titleCase(state))} <strong>{count}</strong>
            </span>
          ))}
          <span>
            <Circle size={12} /> {t('Unmarked')} <strong>{unmarked}</strong>
          </span>
        </div>
      )}
      <div className="toolbar records-toolbar">
        <SearchField value={search} onChange={setSearch} />
        {tab === 'Attendance' && (
          <select
            aria-label={t('Attendance filter')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {['All children', 'Unmarked', 'Needs review'].map((v) => (
              <option key={v} value={v}>
                {t(v)}
              </option>
            ))}
          </select>
        )}
        <button
          className="button outline"
          onClick={() =>
            downloadCSV(tab === 'Attendance' ? 'smriva-attendance.csv' : 'smriva-assessments.csv', [
              [
                'child_id',
                'name',
                'class',
                tab === 'Attendance' ? 'date' : 'assessment',
                tab === 'Attendance' ? 'attendance' : 'score',
              ],
              ...rows.map((c) => [
                c.id,
                c.name,
                c.class,
                tab === 'Attendance' ? date : assessment,
                entities[recordId(c.id)]?.[tab === 'Attendance' ? 'attendance' : 'score'] ?? '',
              ]),
            ])
          }
        >
          <Download size={16} /> {t('Export')}{' '}
        </button>
      </div>
      {error && <Notice tone="coral">{t(error)}</Notice>}
      <Panel
        className="flush-panel entry-panel"
        title={t('{count} children', { count: rows.length })}
        aside={
          <span className="fine no-margin">
            {tab === 'Attendance' ? t('Changes save immediately') : t('0–100 points per attempt')}
          </span>
        }
      >
        {tab === 'Attendance' && (
          <div className="bulk-toolbar">
            <label className="checkbox-label no-margin">
              <input
                type="checkbox"
                aria-label={t('Select all visible children')}
                checked={rows.length > 0 && rows.every((c) => selected.has(c.id))}
                onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((c) => c.id)) : new Set())}
              />
              {selectedRows.length ? t('{count} selected', { count: selectedRows.length }) : t('Bulk entry')}
            </label>
            <select
              aria-label={t('Bulk attendance status')}
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {t(titleCase(s))}
                </option>
              ))}
            </select>
            <button
              className="button outline"
              disabled={busy || !bulkRows.length}
              onClick={async () => {
                setBusy(true);
                setError('');
                try {
                  await vault.writeMany(
                    bulkRows.map((c) => ({
                      entityId: `${c.id}:${date}`,
                      field: 'attendance',
                      value: bulk,
                      type: 'attendance',
                    })),
                  );
                  refresh();
                  notify(t('{count} attendance marks saved on this device', { count: bulkRows.length }));
                  setSelected(new Set());
                } catch (e: any) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy
                ? t('Saving…')
                : selectedRows.length
                  ? t('Apply to {count} selected', { count: bulkRows.length })
                  : t('Mark {count} remaining {status}', {
                      count: bulkRows.length,
                      status: t(bulk),
                    })}
            </button>
            <span className="fine no-margin">
              {selectedRows.length
                ? t('Existing marks change only for selected children. Conflicts are excluded.')
                : t('Existing marks and conflicts are kept.')}
            </span>
          </div>
        )}
        <div className="table-scroll">
          <table ref={table} className="entry-table">
            <thead>
              <tr>
                {tab === 'Attendance' && <th className="checkbox-cell" />}
                <th>{t('Child')}</th>
                <th>{t('Class')}</th>
                <th>{tab === 'Attendance' ? t('Attendance') : t('Score / 100')}</th>
                <th>{t('Save status')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, index) => {
                const record = entities[recordId(c.id)],
                  value = record?.[tab === 'Attendance' ? 'attendance' : 'score'];
                return (
                  <tr
                    key={c.id}
                    data-entry-row
                    tabIndex={tab === 'Attendance' ? 0 : undefined}
                    aria-label={
                      tab === 'Attendance' ? t('{name} attendance row', { name: c.name }) : undefined
                    }
                    onKeyDown={(e) => rowKey(e, c.id, index)}
                    className={selected.has(c.id) ? 'row-selected' : ''}
                  >
                    {tab === 'Attendance' && (
                      <td className="checkbox-cell">
                        <input
                          type="checkbox"
                          aria-label={t('Select {name}', { name: c.name })}
                          checked={selected.has(c.id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            e.target.checked ? next.add(c.id) : next.delete(c.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                    )}
                    <td>
                      <Link className="person-link" to={'/app/children/' + c.id}>
                        <span>
                          <strong>{c.name ?? t('Identity needs review')}</strong>
                          <small>{c.id}</small>
                        </span>
                      </Link>
                    </td>
                    <td>{t(c.class ?? 'Needs review')}</td>
                    <td>
                      {tab === 'Attendance' ? (
                        <div className="attendance-buttons">
                          {states.map((state) => (
                            <button
                              key={state}
                              aria-label={t('{name}: {status}', {
                                name: c.name,
                                status: t(state),
                              })}
                              aria-pressed={value === state}
                              disabled={record?.hasConflict}
                              className={value === state ? 'selected ' + state : ''}
                              onClick={() => void mark(c.id, state)}
                            >
                              <span className={'attendance-dot ' + state} />
                              {t(titleCase(state))}
                              <kbd>{state[0].toUpperCase()}</kbd>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="score-entry">
                          <input
                            data-score
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            disabled={record?.hasConflict}
                            aria-label={t('{name} score', { name: c.name })}
                            aria-invalid={Boolean(scoreErrors[c.id])}
                            value={drafts[c.id] ?? (value === null ? '' : (value ?? ''))}
                            placeholder={record?.hasConflict ? t('Review') : '—'}
                            onChange={(e) => setDraft(c.id, e.target.value)}
                            onBlur={() => void saveScore(c.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void saveScore(c.id, index + 1);
                              }
                              if (e.key === 'Escape') {
                                const next = { ...draftRef.current };
                                delete next[c.id];
                                draftRef.current = next;
                                setDrafts(next);
                                void vault
                                  .saveEntryDrafts({ ['score|' + c.id]: null })
                                  .catch((err: any) => setError(err.message));
                                setScoreErrors((s) => ({ ...s, [c.id]: '' }));
                              }
                            }}
                          />
                          {drafts[c.id] !== undefined && (
                            <small className="draft-label">
                              {draftStatus[c.id] === 'saving'
                                ? t('Saving draft…')
                                : draftStatus[c.id] === 'error'
                                  ? t('Draft not saved')
                                  : t('Encrypted draft saved')}
                            </small>
                          )}
                          {scoreErrors[c.id] && (
                            <span className="field-error" role="alert">
                              {t(scoreErrors[c.id])}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      {record?.hasConflict ? (
                        <Link to="/app/conflicts">
                          <Badge tone="coral">{t('Needs review')}</Badge>
                        </Link>
                      ) : scoreErrors[c.id] ? (
                        <span className="field-error">{t('Not saved')}</span>
                      ) : drafts[c.id] !== undefined ? (
                        <span className="draft-label">{t('Local draft')}</span>
                      ) : value !== undefined ? (
                        <span className="saved-label">
                          <Check size={14} /> {t('Saved locally')}{' '}
                        </span>
                      ) : (
                        <span className="muted">{t('Not entered')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <Empty
            title={t('No matching children')}
            description={t('Change the filters to continue entering records.')}
          />
        )}
      </Panel>
      <p className="fine">
        <LockKeyhole size={13} />{' '}
        {t(
          'Incompatible concurrent entries require review. Separate assessment attempt numbers keep their own scores.',
        )}{' '}
      </p>
    </>
  );
}
export function Health() {
  const { t, locale } = useI18n();
  const { write, version, easyMode } = useKuka(),
    children = childrenOnDevice(),
    [search, setSearch] = useState(''),
    [child, setChild] = useState(''),
    [kind, setKind] = useState('visits'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [formKey, setFormKey] = useState(0),
    [saved, setSaved] = useState('');
  const shown = children.filter((c) => matchesChild(c, search)),
    chosen = children.find((c) => c.id === child),
    events = chosen
      ? [
          ...(chosen.visits ?? []).map((e: any) => ({ ...e, type: 'Visit', detail: e.note })),
          ...(chosen.growth ?? []).map((e: any) => ({
            ...e,
            type: 'Growth',
            detail: `${e.weight} kg · ${e.height} cm`,
          })),
          ...(chosen.doses ?? []).map((e: any) => ({ ...e, type: 'Vaccination', detail: e.name })),
        ].sort((a, b) => String(b.date).localeCompare(String(a.date)))
      : [];
  return (
    <>
      <PageTitle
        eyebrow={t('Dhareri village hub')}
        title={t('Health records')}
        description={
          easyMode
            ? t('Choose the child, fill in the visit details, then select Save health record.')
            : t('Select a child, enter the event, and save locally. Every event is retained separately.')
        }
      />
      <div className="health-entry-layout">
        <Panel title={t('New health record')}>
          <Form
            key={formKey}
            onSubmit={async (f) => {
              setBusy(true);
              setError('');
              setSaved('');
              try {
                if (!child) throw new Error('Select a child before saving.');
                if (kind === 'visits' && !String(f.get('note') ?? '').trim())
                  throw new Error('Enter a visit note.');
                if (
                  kind === 'doses' &&
                  ['dose', 'batch', 'site'].some((key) => !String(f.get(key) ?? '').trim())
                )
                  throw new Error('Vaccine name, batch, and site are required.');
                const value =
                  kind === 'visits'
                    ? {
                        date: String(f.get('date')),
                        note: String(f.get('note')).trim(),
                        worker: vault.state!.identity.actorId,
                      }
                    : kind === 'growth'
                      ? {
                          date: String(f.get('date')),
                          weight: Number(f.get('weight')),
                          height: Number(f.get('height')),
                          muac: f.get('muac') ? Number(f.get('muac')) : null,
                        }
                      : {
                          name: String(f.get('dose')).trim(),
                          date: String(f.get('date')),
                          batch: String(f.get('batch')).trim(),
                          site: String(f.get('site')).trim(),
                        };
                await write(child, kind, value, 'add');
                setSaved('Saved locally. Ready for the next record.');
                setFormKey((v) => v + 1);
              } catch (e: any) {
                setError(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              {t('Find a child')}{' '}
              <input
                aria-label={t('Find child for health record')}
                placeholder={
                  easyMode ? t('Type the child’s name or village…') : t('Name, internal ID, village…')
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <label>
              {t('Child')} <span className="required-mark">*</span>
              <select
                aria-label={t('Child for health record')}
                value={child}
                onChange={(e) => {
                  setChild(e.target.value);
                  setSaved('');
                }}
                required
              >
                <option value="">{t('Select a child…')}</option>
                {shown.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {t(c.class ?? 'Needs review')} · {c.village}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid">
              <label>
                {t('Record type')}{' '}
                <select
                  value={kind}
                  onChange={(e) => {
                    setKind(e.target.value);
                    setSaved('');
                  }}
                >
                  <option value="visits">{t('Health visit')}</option>
                  <option value="growth">{t('Growth measurement')}</option>
                  <option value="doses">{t('Vaccination event')}</option>
                </select>
              </label>
              <label>
                {t('Date')}{' '}
                <input name="date" type="date" defaultValue={localDate()} max={localDate()} required />
              </label>
            </div>
            {kind === 'visits' ? (
              <label>
                {t('Visit note')}{' '}
                <textarea
                  name="note"
                  required
                  maxLength={1000}
                  placeholder={t('Enter the visit observations…')}
                />
              </label>
            ) : kind === 'growth' ? (
              <>
                <div className="form-grid">
                  <label>
                    {t('Weight (kg)')}{' '}
                    <input name="weight" type="number" step="0.1" min="0.1" max="200" required />
                  </label>
                  <label>
                    {t('Height (cm)')}{' '}
                    <input name="height" type="number" step="0.1" min="20" max="220" required />
                  </label>
                </div>
                <label>
                  {t('MUAC (cm, optional)')} <input name="muac" type="number" step="0.1" min="3" max="60" />
                  {easyMode && (
                    <span className="fine no-margin">
                      {t('Mid-upper arm circumference, in centimetres. Leave blank if not measured.')}{' '}
                    </span>
                  )}
                </label>
              </>
            ) : (
              <>
                <label>
                  {t('Vaccine / dose name')} <input name="dose" required maxLength={100} />
                </label>
                <div className="form-grid">
                  <label>
                    {t('Batch')} <input name="batch" required maxLength={60} />
                  </label>
                  <label>
                    {t('Site')} <input name="site" required maxLength={100} />
                  </label>
                </div>
              </>
            )}
            {error && <Notice tone="coral">{t(error)}</Notice>}
            {saved && (
              <div className="inline-success">
                <CheckCircle2 size={16} />
                {t(saved)}
              </div>
            )}
            <div className="form-actions">
              <Submit busy={busy} label={t('Save health record')} />
            </div>
            <p className="fine">
              {t('Ctrl+Enter to save. Child and record type stay selected for repeated entry.')}{' '}
            </p>
          </Form>
        </Panel>
        <aside>
          <Panel title={chosen ? chosen.name : t('Selected child')} translateTitle={false}>
            {chosen ? (
              <>
                <dl className="detail-list">
                  <div>
                    <dt>{t('ID')}</dt>
                    <dd>{chosen.id}</dd>
                  </div>
                  <div>
                    <dt>{t('Date of birth')}</dt>
                    <dd>{chosen.dob}</dd>
                  </div>
                  <div>
                    <dt>{t('Village')}</dt>
                    <dd>{chosen.village}</dd>
                  </div>
                  <div>
                    <dt>{t('Consent')}</dt>
                    <dd>{chosen.consent === true ? t('Recorded') : t('Needs review')}</dd>
                  </div>
                </dl>
                <Link className="text-link" to={'/app/children/' + chosen.id}>
                  {t('Open full child record')} <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <p className="muted">{t('Select a child to check their details and recent health events.')}</p>
            )}
          </Panel>
          {chosen && (
            <Panel title={t('Recent events')}>
              <div className="compact-events">
                {events.slice(0, 8).map((event: any) => (
                  <div key={event.opId}>
                    <span className="muted">{event.date}</span>
                    <strong>{t(event.type)}</strong>
                    <p>{event.detail}</p>
                  </div>
                ))}
                {!events.length && <p className="muted">{t('No recorded health events.')}</p>}
              </div>
            </Panel>
          )}
          <p className="fine">
            {t(
              'Raw measurements and recorded events only. Clinical calculations, treatment advice, and vaccination scheduling are outside this prototype.',
            )}{' '}
          </p>
        </aside>
      </div>
    </>
  );
}
