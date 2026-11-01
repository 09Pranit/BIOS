import React, { useState, useEffect, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Plus,
  Users,
  Heart,
  GraduationCap,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  Check,
  Clock,
  BookOpen,
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
import { displayRole } from '../lib/presentation';
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
import { lessons } from '../lib/content';
import GovernmentResources from '../components/GovernmentResources';
import { governmentResources } from '../lib/government-resources';
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
const useChildren = () => {
  const { version } = useKuka();
  return Object.values(vault.view.entities)
    .filter((e: any) => e.type === 'child' && !e.deleted && !e.id.startsWith('lab-'))
    .sort((a, b) => a.id.localeCompare(b.id));
};
const counts = () => {
  const s = vault.view;
  return {
    children: Object.values(s.entities).filter(
      (e) => e.type === 'child' && !e.deleted && !e.id.startsWith('lab-'),
    ).length,
    attendance: Object.values(s.entities).filter((e) => e.type === 'attendance' && e.id.endsWith(today())),
    visits: Object.values(s.entities)
      .filter((e) => e.type === 'child' && !e.deleted && !e.id.startsWith('lab-'))
      .reduce((n, e) => n + (e.visits?.length ?? 0), 0),
    conflicts: s.conflicts.length,
  };
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
export function ChildForm({
  close,
  child,
  profile = 'student',
}: {
  close: () => void;
  child?: any;
  profile?: 'student' | 'patient';
}) {
  const { t, locale, language } = useI18n();
  const { refresh, notify } = useKuka(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [formKey, setFormKey] = useState(0),
    [initialChild] = useState(() => (child ? { ...child } : undefined)),
    [observedAtStart] = useState(() => vault.state!.ops.slice()),
    [defaultClass, setDefaultClass] = useState(child?.class ?? 'Class 1'),
    newTitle = profile === 'patient' ? 'New patient' : 'New student';
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
              { entityId: id, field: 'class', value: String(data.get('class')) },
              // Village is retained for older records and sync compatibility,
              // but is no longer requested when creating or editing a person.
              { entityId: id, field: 'village', value: initialChild?.village ?? 'Not specified' },
              { entityId: id, field: 'consent', value: true },
            ];
            if (!initialChild)
              values.push({ entityId: id, field: 'tags', value: profile, kind: 'add' });
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
          <input
            name="guardian"
            defaultValue={initialChild?.guardian}
            maxLength={80}
          />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" required defaultChecked={Boolean(child?.consent)} />{' '}
          {t(
            'Guardian consent obtained for a shared health and school record. Use synthetic details in this demo.',
          )}
        </label>
        {error && <Notice tone="coral">{error}</Notice>}
        <div className="form-actions">
          <Submit
            busy={busy}
            label={t(child ? 'Save changes' : profile === 'patient' ? 'Save patient' : 'Save student')}
          />
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
            {child.class} · {child.village} {t('· Born')} {child.dob ?? t('Needs review')}
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
        <Panel title={t('Child details')}>
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
              <dt>{t('Village')}</dt>
              <dd>{child.village}</dd>
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
        <Panel title={t('Health history')}>
          <div className="timeline">
            {(child.visits ?? []).map((v: any) => (
              <div key={v.opId}>
                <span className="timeline-dot peach" />
                <strong>
                  {t('Health visit ·')} {v.date}
                </strong>
                <p>{v.note}</p>
                <small>{v.worker}</small>
              </div>
            ))}
            {(child.growth ?? []).map((v: any) => (
              <div key={v.opId}>
                <span className="timeline-dot green" />
                <strong>
                  {t('Growth measurement ·')} {v.date}
                </strong>
                <p>
                  {v.weight} {t('kg ·')} {v.height} {t('cm')}
                </p>
                <small>{t('Raw measurement · no diagnostic classification')}</small>
              </div>
            ))}
            {(child.doses ?? []).map((v: any) => (
              <div key={v.opId}>
                <span className="timeline-dot blue" />
                <strong>
                  {v.name} · {v.date}
                </strong>
                <p>
                  {t('Batch')} {v.batch} · {v.site}
                </p>
              </div>
            ))}
          </div>
          {!(child.visits?.length || child.growth?.length || child.doses?.length) && (
            <Empty
              title={t('No health history yet')}
              description={t('Add a health visit or record classroom activity.')}
            />
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
    conflicts = vault.view.conflicts,
    [error, setError] = useState(''),
    [custom, setCustom] = useState<Record<string, string>>({});
  return (
    <>
      <PageTitle
        eyebrow={t('Record review')}
        title={t('Conflict inbox')}
        description={t('Compare both entries before choosing a value. The original versions stay in the record.')}
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
            description={t('When people make incompatible changes independently, both accounts will appear here. Try a real concurrent edit in the resilience lab.')}
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
              {t('The resolution is a new operation with causal references to the alternatives. Independent conflicting resolutions remain reviewable.')}
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
            <RefreshCw size={16} className={status === 'Syncing' ? 'spin' : ''} />{' '}
            {t('Sync now')}
          </button>
        }
      >
        <p>{t('Local storage and remote backup are different promises. See exactly where your work lives.')}</p>
      </Panel>
      {error && (
        <Notice tone="coral">
          {error} {t('Your local records remain saved. Reconnect and retry.')}
        </Notice>
      )}
      <div className="metrics">
        <Metric
          icon={<LockKeyhole size={20} />}
          label={t('Saved on this device')}
          value={s.ops.length}
          note={t('Encrypted and kept here')}
        />
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
export function Library() {
  const { t, locale, language } = useI18n();
  const { write, notify, version } = useKuka(),
    [filter, setFilter] = useState('All subjects'),
    [selected, setSelected] = useState<(typeof lessons)[number] | null>(null),
    [answer, setAnswer] = useState<number | null>(null),
    [result, setResult] = useState(''),
    [cached, setCached] = useState<string[]>([]),
    [cacheError, setCacheError] = useState('');
  const entities = vault.view.entities;
  const attemptCount = (id: string) => entities['lesson-' + id]?.progress?.length ?? 0;
  const totalAttempts = lessons.reduce((sum, lesson) => sum + attemptCount(lesson.id), 0);
  const featured = governmentResources.find((resource) => resource.id === 'diksha')!;
  const openLesson = (lesson: (typeof lessons)[number]) => {
    setSelected(lesson);
    setAnswer(null);
    setResult('');
  };
  useEffect(() => {
    if (!('caches' in window)) return;
    caches
      .open('kuka-lessons')
      .then(async (c) => {
        const keys = await c.keys();
        setCached(keys.map((k) => k.url.split('/').pop()!.replace('.json', '')));
      })
      .catch(() =>
        setCacheError(
          'Extra lesson caching is unavailable. The original lessons remain bundled with the app.',
        ),
      );
  }, []);
  return (
    <div className="library-experience">
      <PageTitle
        eyebrow={t('Learning resources')}
        title={t('Learning library')}
        description={t('Lessons to use here, and links to education and health programmes.')}
      />
      <section className="learning-hero" aria-label={t('Your learning space')}>
        <div className="learning-hero-copy">
          <h2>{t('Pick something to learn')}</h2>
          <p>{t('Short lessons work offline. Government websites need a connection.')}</p>
          <div className="learning-hero-actions">
            <a className="button primary" href="#offline-lessons">
              <BookOpen size={16} aria-hidden="true" />
              {t('Start an offline lesson')}
            </a>
            <a className="button outline" href="#government-programmes">
              {t('Explore programmes')} <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="learning-highlights">
            <span>
              <WifiOff size={15} aria-hidden="true" />
              {lessons.length} {t('offline lessons')}
            </span>
            <span>
              {governmentResources.length} {t('official programmes')}
            </span>
            <span>
              {t(totalAttempts === 1 ? '{count} saved practice attempt' : '{count} saved practice attempts', {
                count: totalAttempts,
              })}
            </span>
          </div>
        </div>
        <figure className="learning-featured-image">
          <a
            className="learning-featured-link"
            href={featured.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t('Open {title} official website. Internet needed. Opens in a new tab.', {
              title: t(featured.title),
            })}
          >
            <img
              src={featured.image}
              alt={t('Official DIKSHA banner showing schoolchildren exploring digital learning')}
              width={643}
              height={216}
              decoding="async"
            />
          </a>
          <figcaption>
            {t('Image: Ministry of Education ·')}{' '}
            <a href={featured.imageSource} target="_blank" rel="noopener noreferrer">
              {t('DIKSHA official banner')}
            </a>
          </figcaption>
        </figure>
      </section>
      <div className="learning-section-heading" id="offline-lessons">
        <div>
          <h2>{t('Start an offline lesson')}</h2>
        </div>
        <p>{t('Original Smriva activities · Your quiz attempts save on this device.')}</p>
      </div>
      <div className="toolbar">
        <select
          aria-label={t('Filter learning resources')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {['All subjects', 'Mathematics', 'Science', 'Reading', 'Health literacy'].map((s) => (
            <option key={s} value={s}>
              {t(s)}
            </option>
          ))}
        </select>
        <span className="fine">
          {t('Smriva original content · CC BY 4.0 · {language}', {
            language: languages.find((entry) => entry.code === language)!.name,
          })}
        </span>
      </div>
      {cacheError && <Notice tone="coral">{t(cacheError)}</Notice>}
      <div className="lesson-grid">
        {lessons
          .filter((l) => filter === 'All subjects' || l.subject === filter)
          .map((l) => (
            <article className="lesson-card" key={l.id}>
              <button
                className={'lesson-art ' + l.color}
                onClick={() => openLesson(l)}
                aria-label={t('Open {title} · {duration}', { title: t(l.title), duration: t(l.duration) })}
              >
                <img
                  src={'/learning/' + l.id + '.svg'}
                  alt=""
                  width={640}
                  height={360}
                  loading="lazy"
                  decoding="async"
                />
                <span className="lesson-duration">
                  <Clock size={12} /> {t(l.duration)}
                </span>
              </button>
              <div className="lesson-info">
                <p className="eyebrow">
                  {t(l.subject)} <span>·</span> <span>{t(l.level)}</span>
                </p>
                <h3>
                  <button type="button" className="lesson-title-button" onClick={() => openLesson(l)}>
                    {t(l.title)}
                  </button>
                </h3>
                <p>{t(l.description)}</p>
                <div>
                  <Badge>{t('Available offline')}</Badge>
                  <button
                    className="icon-button"
                    aria-label={t(
                      cached.includes(l.id) ? 'Remove cached pack {title}' : 'Download lesson pack {title}',
                      { title: t(l.title) },
                    )}
                    onClick={async () => {
                      try {
                        const cache = await caches.open('kuka-lessons');
                        if (cached.includes(l.id)) {
                          await cache.delete('/lessons/' + l.id + '.json');
                          setCached(cached.filter((id) => id !== l.id));
                          notify(t('Extra cached pack removed. The bundled lesson remains available.'));
                        } else {
                          await cache.put(
                            '/lessons/' + l.id + '.json',
                            new Response(JSON.stringify(l), {
                              headers: { 'Content-Type': 'application/json' },
                            }),
                          );
                          setCached([...cached, l.id]);
                          notify(t('Lesson pack stored in the offline cache'));
                        }
                        setCacheError('');
                      } catch {
                        setCacheError(
                          'The extra lesson pack could not be cached. Your practice records are unchanged; try again when device storage is available.',
                        );
                      }
                    }}
                  >
                    {cached.includes(l.id) ? <Check size={17} /> : <Download size={17} />}
                  </button>
                </div>
                {attemptCount(l.id) > 0 && (
                  <p className="lesson-practice-status">
                    <CheckCircle2 size={14} aria-hidden="true" />
                    {t(
                      attemptCount(l.id) === 1
                        ? '{count} saved practice attempt'
                        : '{count} saved practice attempts',
                      { count: attemptCount(l.id) },
                    )}
                  </p>
                )}
              </div>
            </article>
          ))}
      </div>
      <GovernmentResources />
      <Panel title={t('Other learning websites')}>
        <p>
          {t('Explore more collections online. Their websites and materials are not downloaded by Smriva.')}
        </p>
        <div className="external-links">
          <External href="https://diksha.gov.in/">{t('DIKSHA')}</External>
          <External href="https://phet.colorado.edu/en/offline-access">
            {t('PhET offline access guide')}
          </External>
          <External href="https://openstax.org/subjects">{t('OpenStax textbooks')}</External>
        </div>
      </Panel>
      {selected && (
        <Modal title={t(selected.title)} close={() => setSelected(null)}>
          <div className="lesson-reader" lang={language}>
            <img
              className="lesson-reader-cover"
              src={'/learning/' + selected.id + '.svg'}
              alt=""
              width={640}
              height={360}
            />
            <Badge>
              {t(selected.subject)} · <span>{t(selected.level)}</span>
            </Badge>
            {selected.body.map((p, i) => (
              <p key={i}>{t(p)}</p>
            ))}
            <hr />
            <h3>{t('Give it a try')}</h3>
            <p>{t(selected.question)}</p>
            <div className="quiz-options">
              {selected.options.map((o, i) => (
                <button className={answer === i ? 'selected' : ''} onClick={() => setAnswer(i)} key={o}>
                  {String.fromCharCode(65 + i)} <span>{t(o)}</span>
                </button>
              ))}
            </div>
            <button
              className="button primary"
              disabled={answer === null}
              onClick={async () => {
                try {
                  await write(
                    'lesson-' + selected.id,
                    'progress',
                    { lesson: selected.id, answer, correct: answer === selected.answer, date: today() },
                    'add',
                    'lesson',
                  );
                  setResult(
                    answer === selected.answer
                      ? 'That’s right. Your progress is saved.'
                      : 'A good try. Read the lesson and give it another go. Your attempt is saved.',
                  );
                } catch (e: any) {
                  setResult(e.message);
                }
              }}
            >
              {t('Check & save my progress')} <ArrowRight size={15} />
            </button>
            {result && (
              <p role="status" className="quiz-feedback">
                {t(result)}
              </p>
            )}
            <p className="fine">
              {t('Original text by the Smriva project · CC BY 4.0 · Not clinical advice')}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
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
        description={t('Synchronize records, download a backup, or save your recovery code before changing devices.')}
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
        description="An offline-first prototype for health and education. Built at BIOS V2. No affiliation or deployment claims."
      />
      <Panel title="What this build does">
        <p>
          Every local write commits an encrypted operation log to IndexedDB before the interface confirms it.
          The shared service uses SQLite transactions, immutable operation IDs, bounded delta batches, durable
          cursors, authenticated device sessions, and encrypted storage.
        </p>
        <p>
          Critical fields use multi-value registers with causal ancestry. Tags use observed-remove semantics;
          visits, doses, growth, and lesson attempts are append-only sets. Stock deltas use an idempotent
          operation-based counter. These implementations are exercised by property and integration tests.
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
                <td>Four original lesson texts and quizzes</td>
                <td>Smriva project</td>
                <td>Bundled · CC BY 4.0</td>
              </tr>
              <tr>
                <td>Bird, village, lesson illustrations and interface artwork</td>
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
                <td>Eight official programme reference images</td>
                <td>Ministry of Education / National Health Mission, MoHFW</td>
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
          </External>{' '}
          and{' '}
          <External href="https://nhm.gov.in/index4.php?lang=1&level=0&lid=13&linkid=8">
            health image policy
          </External>
          . Source credits are shown with each programme in the Learning library. No government endorsement of
          Smriva is implied.
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
          permissions, district peer replication, Merkle repair trees, clinical decision support and external
          integrations are not completed. Workspace controls and the four original lessons are available in
          English, Hindi and Punjabi; source documentation and raw technical logs remain English. Do not
          deploy this demo with real personal data.
        </p>
        <p>
          The hub encrypts operation bodies with an environment key. Database indexes expose operation IDs,
          school IDs, device IDs, and metadata. HTTPS, clinical safety review, data-protection review,
          hardened identity, and a managed key store are required for real deployments.
        </p>
        <p>
          Unsynchronized work without a backup cannot be recovered after device loss. Signed bundles require
          the same trusted hub key. A SHA-256 log digest proves equal logs when compared; it does not
          independently prove clinical correctness.
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
