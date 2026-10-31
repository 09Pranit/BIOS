import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { checkDevice, type DeviceIssue } from '../lib/platform';
import { useI18n } from '../lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

export default function DeviceGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [issue, setIssue] = useState<DeviceIssue | null | 'checking'>('checking');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setIssue('checking');
    void checkDevice().then((result) => {
      if (active) setIssue(result);
    });
    return () => {
      active = false;
    };
  }, [retry]);
  if (issue === null) return <>{children}</>;
  const message =
    issue === 'connection'
      ? 'Open the HTTPS address provided by your hub administrator. A localhost address opens only the device you are using.'
      : issue === 'storage'
        ? 'Allow site storage, then try again. If you opened this link inside another app, open it in your browser instead.'
        : 'Open this page in an updated Chrome, Edge, Firefox or Safari browser. This browser cannot provide the encryption needed for your records.';
  return (
    <main className="standalone device-check">
      <LanguageSwitcher />
      <Link to="/" className="text-link">
        Smriva
      </Link>
      <section className="unlock-card" aria-live="polite" aria-busy={issue === 'checking'}>
        <h1>{t(issue === 'checking' ? 'Checking this device…' : 'Set up secure access')}</h1>
        {issue !== 'checking' && (
          <>
            <p>{t(message)}</p>
            <p className="fine">{t('Your existing records have not been changed.')}</p>
            <button className="button primary" onClick={() => setRetry((value) => value + 1)}>
              {t('Check again')}
            </button>
            <p>
              <Link to="/about">{t('Sources & method')}</Link>
            </p>
          </>
        )}
      </section>
    </main>
  );
}
