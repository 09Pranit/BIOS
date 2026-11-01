import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FlaskConical,
  WifiOff,
  Wifi,
  RefreshCw,
  Play,
  Square,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Check,
  Download,
  Activity,
  RotateCcw,
  AlertTriangle,
  Layers,
  GitBranch,
  Trash2,
} from 'lucide-react';
import { Vault, enroll, download } from '../lib/vault';
import { useKuka } from '../lib/context';
import { useI18n } from '../lib/i18n';
import { newId } from '../lib/platform';
import { digest, union, materialize, type Op } from '../../../../packages/sync-core/src/index';
import { runSimulation, type ChaosResult } from '../../../../packages/chaos/src/simulation';
import { PageTitle, Panel, Badge, Notice, Empty, bytes } from '../components/UI';
const sessions = [new Vault('lab-a'), new Vault('lab-b')];
export default function Lab() {
  const { t } = useI18n();
  const { notify } = useKuka(),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [events, setEvents] = useState<string[]>([]),
    [profile, setProfile] = useState('Offline'),
    [rev, setRev] = useState(0),
    [roots, setRoots] = useState<string[]>([]),
    [benchmark, setBenchmark] = useState<Omit<ChaosResult, 'replicas'> | null>(null),
    [seed, setSeed] = useState('42'),
    [draft, setDraft] = useState(['2018-04-15', '2018-06-20']),
    [entity, setEntity] = useState('lab-child'),
    [drop, setDrop] = useState(false),
    [hubOps, setHubOps] = useState<Op[]>([]);
  const abort = useRef<AbortController | null>(null),
    record = (message: string) =>
      setEvents((e) => [`${new Date().toLocaleTimeString()} · ${message}`, ...e].slice(0, 60)),
    refresh = () => setRev((x) => x + 1);
  useEffect(() => {
    Promise.all(sessions.map((s) => (s.state ? Promise.resolve() : s.unlock('lab-pin-2026'))))
      .then(() => setReady(true))
      .catch(() => {});
  }, []);
  useEffect(() => {
    Promise.all(sessions.map((s) => digest(s.state?.ops ?? []))).then(setRoots);
  }, [rev, ready]);
  const initialize = async () => {
    setBusy(true);
    setError('');
    try {
      for (let i = 0; i < 2; i++) {
        const s = sessions[i];
        if (!s.state) {
          if (await s.exists()) await s.unlock('lab-pin-2026');
          else
            await s.create(
              'lab-pin-2026',
              await enroll(i ? 'Harpreet · Device B' : 'Gurpreet · Device A', 'Reviewer'),
            );
        }
        await s.sync();
      }
      setReady(true);
      setProfile('Offline');
      record(
        'Two independent encrypted IndexedDB workspaces provisioned and synchronized. Links set offline.',
      );
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const edit = async (i: number) => {
    setError('');
    try {
      const s = sessions[i];
      await s.write(entity, 'dob', draft[i]);
      record(`Device ${i ? 'B' : 'A'} committed DOB ${draft[i]} locally. No network request.`);
      refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };
  const runScenario = async () => {
    setBusy(true);
    setError('');
    try {
      const id = 'lab-child-' + newId().slice(0, 8);
      setEntity(id);
      await sessions[0].write(id, 'dob', draft[0]);
      await sessions[1].write(id, 'dob', draft[1]);
      await sessions[0].write(
        id,
        'attempts',
        { note: 'Independent assessment on A', date: '2026-10-31' },
        'add',
      );
      await sessions[1].write(id, 'tags', 'School support', 'add');
      for (let i = 0; i < 45; i++)
        await sessions[i % 2].write(
          id,
          'attempts',
          { note: 'Chunk recovery event ' + i, date: '2026-10-31' },
          'add',
        );
      record(
        '49 real operations committed offline: incompatible DOB values, an independent tag, and 46 assessment attempts.',
      );
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const reconnect = async () => {
    if (profile === 'Offline') {
      setError('The lab link is offline. Select Good, 2G, or Flaky to reconnect.');
      return;
    }
    setBusy(true);
    setError('');
    const controller = new AbortController();
    abort.current = controller;
    const delay = async () => {
      if (profile === 'Good') return;
      await new Promise<void>((resolve, reject) => {
        const t = setTimeout(resolve, profile === '2G' ? 900 : 450);
        controller.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(t);
            reject(new Error('Transfer interrupted. Committed cursor retained.'));
          },
          { once: true },
        );
      });
    };
    try {
      for (let round = 0; round < 2; round++)
        for (let i = 0; i < 2; i++) {
          const before = sessions[i].state!.cursor;
          const r = await sessions[i].sync({
            signal: controller.signal,
            dropAfterCommit: drop && round === 0 && i === 0,
            afterChunk: async () => {
              refresh();
              await delay();
            },
          });
          record(
            `Device ${i ? 'B' : 'A'}: ${r.sent} sent, ${r.received} received, ${bytes(r.bytes)}, ${r.duration} ms. Cursor ${before} → ${sessions[i].state!.cursor}.`,
          );
        }
      const r = await sessions[0].request('summary');
      // Fetch the actual complete hub log via resumable pull to compare canonical digests.
      const log: Op[] = [];
      let cursor = 0,
        more = true;
      while (more) {
        const v = await sessions[0].request(
          'sync',
          { protocol: 1, ops: [], cursor, limit: 64 },
          controller.signal,
        );
        log.push(...v.ops);
        cursor = v.cursor;
        more = v.more;
      }
      setHubOps(union(log));
      record(
        `Actual hub: ${r.operations} durable operations, ${r.conflicts} conflicts. Canonical digest ${r.root.slice(0, 16)}…`,
      );
      notify(t('Lab synchronization complete. Inspect the measured ledger.'));
    } catch (e: any) {
      setError(e.message);
      record('Transfer stopped: ' + e.message);
    } finally {
      setDrop(false);
      setBusy(false);
      abort.current = null;
      refresh();
    }
  };
  const resolve = async (value: any) => {
    setBusy(true);
    try {
      await sessions[0].sync();
      await sessions[0].write(entity, 'dob', value, 'resolve');
      await sessions[0].sync();
      await sessions[1].sync();
      await sessions[0].sync();
      record(
        'Human resolution committed as a new causal operation. Original DOB alternatives remain in the log.',
      );
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const lostPhone = async () => {
    setBusy(true);
    setError('');
    try {
      if (sessions[0].pending.length)
        throw new Error('Sync Device A first. Unsynchronized operations would be lost without a backup.');
      const before = await digest(sessions[0].state!.ops),
        old = sessions[0].state!.identity;
      const r = await fetch('/api/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recovery: old.recovery, actor: 'Recovered Device A' }),
      });
      const identity = await r.json();
      if (!r.ok) throw new Error(identity.error);
      await sessions[0].destroy();
      await sessions[0].create('lab-pin-2026', identity);
      await sessions[0].sync();
      const after = await digest(sessions[0].state!.ops);
      record(
        `Lost phone drill: old device revoked, local lab database deleted, fresh identity recovered ${sessions[0].state!.ops.length} operations. Digest match: ${before === after}.`,
      );
      refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const all = union(...sessions.map((s) => s.state?.ops ?? [])),
    labOps = all.filter((o) => o.entityId.startsWith('lab-')),
    atHub = labOps.filter((o) => hubOps.some((h) => h.opId === o.opId)),
    conflict = ready
      ? sessions[0].view.conflicts.find((c) => c.entityId === entity && c.field === 'dob')
      : undefined,
    agree = roots.length === 2 && roots[0] === roots[1],
    missing = labOps.filter((o) => !sessions.some((s) => s.state?.ops.some((x) => x.opId === o.opId)));
  return (
    <>
      <PageTitle
        eyebrow={t('THE RESILIENCE LAB / REAL EXECUTIONS')}
        title={t('Go ahead. Pull the plug.')}
        description={t('Two independent encrypted devices. One real SQLite hub. Every claim, inspectable.')}
        action={<Badge tone="amber">{t('Developer & judge tools')}</Badge>}
      />
      <Notice>
        {t(
          'This lab creates synthetic records in the real hub. Link profiles add a delay between actual HTTP batches; the chaos benchmark separately simulates packet loss and reordering.',
        )}
      </Notice>
      {!ready ? (
        <Panel>
          <Empty
            icon={<FlaskConical size={36} />}
            title={t('Make the network misbehave')}
            description={t('Provision two independent demo devices, then choose which stories to change.')}
          />
          <button className="button primary centered" onClick={() => void initialize()} disabled={busy}>
            <Play size={16} /> {t(busy ? 'Provisioning devices…' : 'Initialize two real devices')}
          </button>
        </Panel>
      ) : (
        <>
          <div className="lab-controls">
            <div>
              <Wifi size={18} />
              <label>
                {t('Link profile')}
                <select value={profile} onChange={(e) => setProfile(e.target.value)} disabled={busy}>
                  {['Offline', '2G', 'Flaky', 'Good'].map((p) => (
                    <option key={p} value={p}>
                      {t(p)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="button outline" disabled={busy} onClick={() => void runScenario()}>
              <GitBranch size={16} /> {t('Create concurrent scenario')}
            </button>
            <button className="button primary" disabled={busy} onClick={() => void reconnect()}>
              <RefreshCw size={16} className={busy ? 'spin' : ''} /> {t('Reconnect & sync')}
            </button>
            <button
              className="button danger-button"
              disabled={!busy || !abort.current}
              onClick={() => {
                abort.current?.abort();
                record('Judge killed the active transfer.');
              }}
            >
              <Square size={14} /> {t('Kill transfer')}
            </button>
          </div>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={drop}
              onChange={(e) => setDrop(e.target.checked)}
              disabled={busy}
            />{' '}
            {t('Lose the next acknowledgement after the hub commits (real fault injection)')}
          </label>
          <div className="device-grid">
            {sessions.map((s, i) => (
              <Panel
                key={i}
                title={t(i ? 'Device B · Teacher' : 'Device A · Teacher')}
                aside={<Badge tone={profile === 'Offline' ? 'amber' : 'green'}>{t(profile)}</Badge>}
              >
                <div className="device-identity">
                  <Smartphone size={22} />
                  <div>
                    <strong>{s.state?.identity.actorId}</strong>
                    <small>
                      {t('Separate IndexedDB ·')} {s.name}
                    </small>
                  </div>
                </div>
                <label>
                  {t('Child date of birth')}
                  <input
                    aria-label={t('Device {device} date of birth', { device: i ? 'B' : 'A' })}
                    type="date"
                    value={draft[i]}
                    onChange={(e) => setDraft(draft.map((v, n) => (n === i ? e.target.value : v)))}
                  />
                </label>
                <button className="button outline" disabled={busy} onClick={() => void edit(i)}>
                  {t('Save offline on Device')} {i ? 'B' : 'A'} <Check size={15} />
                </button>
                <div className="device-metrics">
                  <span>
                    {t('Local operations')}
                    <strong>{s.state?.ops.length ?? 0}</strong>
                  </span>
                  <span>
                    {t('Pending upload')}
                    <strong>{s.pending.length}</strong>
                  </span>
                  <span>
                    {t('Durable pull cursor')}
                    <strong>{s.state?.cursor ?? 0}</strong>
                  </span>
                </div>
                <p className="eyebrow">{t('CANONICAL LOG DIGEST')}</p>
                <code className="hash small-hash" lang="en">
                  {roots[i] ?? t('Computing…')}
                </code>
              </Panel>
            ))}
          </div>
          <Panel
            title={t('Zero-loss ledger · measured evidence')}
            aside={
              <Badge tone={agree ? 'green' : 'amber'}>
                {t(agree ? 'Replicas agree' : 'Replicas differ')}
              </Badge>
            }
          >
            <div className="ledger-metrics">
              <div>
                <span>{t('Lab operations created')}</span>
                <strong>{labOps.length}</strong>
              </div>
              <div>
                <span>{t('Confirmed at hub*')}</span>
                <strong>{atHub.length}</strong>
              </div>
              <div>
                <span>{t('Preserved in conflict')}</span>
                <strong>
                  {
                    materialize(all)
                      .conflicts.flatMap((c) => c.versions)
                      .filter((o) => o.entityId.startsWith('lab-')).length
                  }
                </strong>
              </div>
              <div>
                <span>{t('Missing from local logs')}</span>
                <strong>{missing.length}</strong>
              </div>
            </div>
            <p className="fine">
              {t(
                '*Hub count is refreshed after a complete reconnect. The local missing-operation check covers the logs currently available, not destroyed or unknown devices. It is not a universal zero-loss guarantee.',
              )}
            </p>
            {conflict && (
              <div className="lab-conflict">
                <AlertTriangle size={20} />
                <div>
                  <strong>{t('Two dates. Both kept.')}</strong>
                  <p>
                    {t(
                      'Two people changed {field} without seeing each other’s work. A clock cannot decide which account is correct.',
                      { field: t('Date of birth') },
                    )}
                  </p>
                  <div className="button-row">
                    {conflict.versions.map((o) => (
                      <button
                        className="button outline"
                        key={o.opId}
                        disabled={busy}
                        onClick={() => void resolve(o.value)}
                      >
                        {t('Confirm')} {String(o.value)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="button-row">
              <button className="button outline" disabled={busy} onClick={() => void lostPhone()}>
                <RotateCcw size={16} /> {t('Lost phone drill (lab device A)')}
              </button>
              <button
                className="button outline"
                onClick={() =>
                  download('smriva-lab-evidence.json', {
                    createdAt: new Date().toISOString(),
                    roots,
                    agree,
                    labOperations: labOps.length,
                    confirmedAtHub: atHub.length,
                    events,
                  })
                }
              >
                <Download size={15} /> {t('Export evidence')}
              </button>
            </div>
          </Panel>
        </>
      )}
      {error && <Notice tone="coral">{t(error)}</Notice>}
      <Panel
        title={t('A benchmark you can rerun')}
        aside={<span className="fine">{t('Deterministic in-process chaos · 8 devices')}</span>}
      >
        <p>
          {t(
            '240 operations. 60% simulated packet loss. Duplicate replay and reordered messages. Twelve lossy rounds, followed by an explicit final reconnect.',
          )}
        </p>
        <div className="button-row">
          <label className="inline-field">
            {t('Seed')}{' '}
            <input
              aria-label={t('Chaos seed')}
              type="number"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </label>
          <button
            className="button primary"
            onClick={() => {
              const { replicas, ...r } = runSimulation(Number(seed), 8, 240, 0.6);
              setBenchmark(r);
              record(
                `Chaos seed ${r.seed}: ${r.created} created, ${r.preserved} preserved, ${r.conflicts} conflicts, ${r.loss} lost, convergence ${r.converged}.`,
              );
            }}
          >
            <Play size={15} /> {t('Run chaos benchmark')}
          </button>
        </div>
        {benchmark && (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t('METHOD')}</th>
                    <th>{t('ACCEPTED OPS')}</th>
                    <th>{t('LOST OPS')}</th>
                    <th>{t('DUPLICATE EFFECTS')}</th>
                    <th>{t('CONVERGED')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <strong>{t('Smriva')}</strong>
                    </td>
                    <td>
                      {benchmark.preserved}/{benchmark.created}
                    </td>
                    <td>{benchmark.loss}</td>
                    <td>{benchmark.duplicateEffects}</td>
                    <td>{t(benchmark.converged ? 'Yes' : 'No')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Notice>
              {t('Whole-field wall-clock LWW discarded')} {benchmark.baselineDiscarded}{' '}
              {t(
                'independent append-only events in this same operation set. Baseline measures event loss; it does not compare full historical operation logs.',
              )}
            </Notice>
            <p className="fine">
              {t('CPU time:')} {benchmark.duration} {t('ms · JSON deltas:')} {bytes(benchmark.bytes)} ·{' '}
              {benchmark.dropped}{' '}
              {t('dropped deliveries. These are simulator measurements, not measured 2G network latency.')}
            </p>
          </>
        )}
      </Panel>
      <Panel
        title={t('The live flight recorder')}
        aside={<span className="fine">{t('Most recent first')}</span>}
      >
        <div className="event-log">
          {events.length ? (
            events.map((e, i) => (
              <div key={i} lang="en">
                {e}
              </div>
            ))
          ) : (
            <p>{t('Initialize the devices or run a benchmark to begin collecting evidence.')}</p>
          )}
        </div>
      </Panel>
    </>
  );
}
