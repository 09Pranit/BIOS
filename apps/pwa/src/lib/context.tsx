import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { vault } from './vault';
import { useI18n } from './i18n';
import { timeoutSignal } from './platform';
export const AppContext = createContext<any>(null);
export const useKuka = () => useContext(AppContext);
export function AppProvider({ children }: { children: ReactNode }) {
  const { language: lang, setLanguage: setLang } = useI18n();
  const [version, setVersion] = useState(0),
    [unlocked, setUnlocked] = useState(false),
    [status, setStatus] = useState('Connecting'),
    [error, setError] = useState(''),
    [toast, setToast] = useState(''),
    [offlineReady, setOfflineReady] = useState(false),
    [offlineUnavailable, setOfflineUnavailable] = useState(false);
  const syncing = useRef(false),
    toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    refresh = useCallback(() => {
      setVersion((v) => v + 1);
      setUnlocked(Boolean(vault.state));
    }, []);
  const notify = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }, []);
  const sync = useCallback(async () => {
    if (!vault.state || syncing.current) return;
    syncing.current = true;
    setStatus('Syncing');
    setError('');
    try {
      await vault.sync();
      refresh();
      setStatus('Synced');
    } catch (e: any) {
      setError(e.message);
      setStatus(e.message?.includes('fetch') || !navigator.onLine ? 'Offline' : 'Sync failed');
    } finally {
      syncing.current = false;
    }
  }, [refresh]);
  useEffect(() => {
    if (!unlocked) return;
    const check = async () => {
      try {
        const r = await fetch('/api/health', { signal: timeoutSignal(4000) });
        if (!r.ok) throw new Error();
        const info = await r.json();
        if (await vault.ensureDemoConflicts(info.demo === true)) refresh();
        await sync();
      } catch {
        setStatus('Offline');
      }
    };
    void check();
    const timer = setInterval(check, 30000);
    window.addEventListener('online', check);
    window.addEventListener('focus', check);
    const offline = () => setStatus('Offline');
    window.addEventListener('offline', offline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', check);
      window.removeEventListener('focus', check);
      window.removeEventListener('offline', offline);
    };
  }, [unlocked, sync, refresh]);
  useEffect(() => {
    if (!unlocked) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (!vault.busy) {
          vault.lock();
          refresh();
          notify('Workspace locked after 15 minutes of inactivity.');
        }
      }, 15 * 60000);
    };
    reset();
    window.addEventListener('pointerdown', reset);
    window.addEventListener('keydown', reset);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [unlocked, refresh, notify]);
  const write = async (...args: Parameters<typeof vault.write>) => {
    try {
      await vault.write(...args);
      refresh();
      notify('Saved on this device · encrypted');
    } catch (e: any) {
      setError(e.message);
      notify(e.message);
      throw e;
    }
  };
  useEffect(() => {
    if (vault.pending.length && status === 'Synced') setStatus('Pending sync');
  }, [version, status]);
  useEffect(() => {
    let serviceWorkers: ServiceWorkerContainer;
    try {
      serviceWorkers = navigator.serviceWorker;
    } catch {
      setOfflineUnavailable(true);
      return;
    }
    if (!serviceWorkers) {
      setOfflineUnavailable(true);
      return;
    }
    const check = () => {
      setOfflineReady(Boolean(serviceWorkers.controller));
      setOfflineUnavailable(document.documentElement.dataset.offlineShell === 'unavailable');
    };
    check();
    serviceWorkers.addEventListener('controllerchange', check);
    window.addEventListener('smriva-offline-status', check);
    return () => {
      serviceWorkers.removeEventListener('controllerchange', check);
      window.removeEventListener('smriva-offline-status', check);
    };
  }, []);
  return (
    <AppContext.Provider
      value={{
        version,
        vault,
        unlocked,
        refresh,
        status,
        setStatus,
        sync,
        error,
        setError,
        toast,
        notify,
        lang,
        setLang,
        offlineReady,
        offlineUnavailable,
        write,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
