import { useI18n } from '../lib/i18n';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Users,
  ArrowRight,
  FilePlus2,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { Modal } from './UI';
import { vault } from '../lib/vault';
import { useKuka } from '../lib/context';
import { matchesChild } from '../lib/entry';
import { isPatientRecord } from '../lib/presentation';
const pages = [
  { title: 'Record database and enrollment', path: '/admin', Icon: Database },
  { title: 'New student', path: '/app/children?new=student', Icon: FilePlus2 },
  { title: 'Attendance and assessments', path: '/app/school', Icon: GraduationCap },
  { title: 'Doctor’s register', path: '/app/doctor', Icon: FilePlus2 },
  { title: 'Settings and sync', path: '/app/settings#sync', Icon: RefreshCw },
  { title: 'Conflict inbox', path: '/app/conflicts', Icon: ShieldCheck },
];
export default function QuickSearch() {
  const { t } = useI18n();
  const { version } = useKuka(),
    [open, setOpen] = useState(false),
    [query, setQuery] = useState(''),
    [active, setActive] = useState(0),
    navigate = useNavigate(),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const children = Object.values(vault.view.entities)
    .filter(
      (c) =>
        c.type === 'child' &&
        !c.deleted &&
        !c.id.startsWith('lab-') &&
        !isPatientRecord(c) &&
        matchesChild(c, query),
    )
    .slice(0, 8);
  const results = [
    ...pages
      .map((p) => ({
        ...p,
        title: t(p.title),
      }))
      .filter((p) => p.title.toLowerCase().includes(query.toLowerCase())),
    ...children.map((c) => ({
      title: c.name ?? t('Identity needs review'),
      path: '/app/children/' + c.id,
      Icon: Users,
      detail: `${c.id} · ${c.class}`,
    })),
  ];
  const choose = (path: string) => {
    navigate(path);
    setOpen(false);
    setQuery('');
    setActive(0);
  };
  return (
    <>
      <button
        className="global-search"
        onClick={() => setOpen(true)}
        aria-label={t('Search or jump to… Ctrl K')}
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Search size={16} />
        <span>{t('Search or jump to…')}</span> <kbd aria-hidden="true">Ctrl K</kbd>
      </button>
      {open && (
        <Modal title={t('Search records and pages')} close={() => setOpen(false)}>
          <div className="command-search">
            <Search size={18} />
            <input
              ref={input}
              autoFocus
              aria-label={t('Search workspace')}
              placeholder={t('Search by name, ID, village, or page…')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((n) => Math.min(n + 1, results.length - 1));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((n) => Math.max(n - 1, 0));
                }
                if (e.key === 'Enter' && results[active]) {
                  e.preventDefault();
                  choose(results[active].path);
                }
              }}
            />
          </div>
          <div className="command-results">
            {results.map((r: any, i) => (
              <button
                key={r.path}
                className={active === i ? 'active' : ''}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(r.path)}
              >
                <r.Icon size={16} />
                <span>
                  <strong>{r.title}</strong>
                  {r.detail && <small>{r.detail}</small>}
                </span>
                <ArrowRight size={14} />
              </button>
            ))}
            {!results.length && <p className="muted">{t('No matching records or pages.')}</p>}
          </div>
          <p className="fine">
            {t('Search runs on this device. ↑ ↓ to navigate, Enter to open, Esc to close.')}
          </p>
        </Modal>
      )}
    </>
  );
}
