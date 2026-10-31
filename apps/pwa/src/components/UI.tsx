import { X, ArrowUpRight, Check, AlertTriangle, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { useI18n, translate, validLanguage } from '../lib/i18n';
import { submitForm } from '../lib/platform';
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
  translateTitle = true,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  /** Set false for record-derived names, which must keep the user's original text. */
  translateTitle?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="page-title">
      <div>
        <p className="eyebrow">{t(eyebrow)}</p>
        <h1>{translateTitle ? t(title) : title}</h1>
        {description && <p className="muted">{t(description)}</p>}
      </div>
      {action}
    </div>
  );
}
export function Badge({ children, tone = 'green' }: { children: ReactNode; tone?: string }) {
  const { t } = useI18n();
  return (
    <span className={'badge ' + tone}>
      <span className="status-dot" />
      {typeof children === 'string' ? t(children) : children}
    </span>
  );
}
export function Panel({
  title,
  aside,
  children,
  className = '',
  translateTitle = true,
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Keep record-derived names literal even when they match an interface message. */
  translateTitle?: boolean;
}) {
  const { t } = useI18n();
  return (
    <section className={'panel ' + className}>
      {title && (
        <div className="panel-heading">
          <h2>{translateTitle ? t(title) : title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
export function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const { t } = useI18n();
  const dialog = useRef<HTMLElement>(null),
    closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      (
        dialog.current?.querySelector(
          '[autofocus], input:not([type="checkbox"]), select, textarea',
        ) as HTMLElement | null
      )?.focus();
    });
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === 'Tab') {
        const items = [
          ...(dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ) ?? []),
        ].filter((el) => el.getClientRects().length);
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <section
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={t(title)}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-heading">
          <h2>{t(title)}</h2>
          <button className="icon-button" aria-label={t('Close dialog')} onClick={close}>
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Empty({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="empty">
      <div className="empty-icon">{icon ?? <Check size={26} />}</div>
      <h3>{t(title)}</h3>
      <p className="muted">{t(description)}</p>
    </div>
  );
}
export const initials = (name: string) =>
  (name ?? '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('');
export const time = (stamp: number, locale?: string) =>
  stamp
    ? new Date(stamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : translate(validLanguage(locale?.split('-')[0]), 'Not yet');
export const bytes = (n: number) => (n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`);
export function Submit({ busy, label = 'Save on this device' }: { busy: boolean; label?: string }) {
  const { t } = useI18n();
  return (
    <button className="button primary" type="submit" disabled={busy}>
      {busy ? <Loader2 size={17} className="spin" /> : <Check size={17} />} {t(busy ? 'Saving…' : label)}
    </button>
  );
}
export function Form({
  onSubmit,
  children,
}: {
  onSubmit: (form: FormData) => Promise<void>;
  children: ReactNode;
}) {
  const clickedSubmitter = useRef<HTMLButtonElement | HTMLInputElement | null>(null);
  return (
    <form
      onClickCapture={(e) => {
        const control = e.target instanceof Element ? e.target.closest('button,input[type="submit"]') : null;
        clickedSubmitter.current =
          (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) &&
          control.type === 'submit' &&
          control.form === e.currentTarget
            ? control
            : null;
      }}
      onKeyDown={(e) => {
        clickedSubmitter.current = null;
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          submitForm(e.currentTarget);
        }
      }}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        // The two-argument FormData constructor and SubmitEvent.submitter are
        // newer than some supported browsers. Preserve named submit actions.
        const control = (e.nativeEvent as SubmitEvent).submitter ?? clickedSubmitter.current;
        clickedSubmitter.current = null;
        if (
          (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) &&
          control.type === 'submit' &&
          control.form === e.currentTarget &&
          control.name &&
          !control.disabled
        )
          data.append(control.name, control.value);
        void onSubmit(data).catch(() => {});
      }}
    >
      {children}
    </form>
  );
}
export function Notice({ children, tone = 'amber' }: { children: ReactNode; tone?: string }) {
  return (
    <div className={'notice ' + tone} role={tone === 'coral' ? 'alert' : undefined}>
      <AlertTriangle size={18} />
      <div>{children}</div>
    </div>
  );
}
export function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children} <ArrowUpRight size={13} />
    </a>
  );
}
