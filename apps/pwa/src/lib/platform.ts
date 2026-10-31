/** APIs newer than our browser target have small, standards-based fallbacks. */
export function newId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function timeoutSignal(milliseconds: number): AbortSignal {
  if (typeof AbortSignal.timeout === 'function') return AbortSignal.timeout(milliseconds);
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException('The connection timed out.', 'TimeoutError'));
  }, milliseconds);
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  return controller.signal;
}

export function localCalendarDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function submitForm(form: HTMLFormElement) {
  if (typeof form.requestSubmit === 'function') form.requestSubmit();
  else {
    // A native click retains required-field validation in older Safari.
    const button = document.createElement('button');
    button.type = 'submit';
    button.hidden = true;
    form.appendChild(button);
    button.click();
    button.remove();
  }
}

export type DeviceIssue = 'connection' | 'browser' | 'storage';
export async function checkDevice(): Promise<DeviceIssue | null> {
  if (globalThis.isSecureContext === false) return 'connection';
  if (
    !globalThis.crypto?.subtle ||
    !globalThis.crypto?.getRandomValues ||
    typeof AbortController === 'undefined' ||
    typeof TextEncoder === 'undefined' ||
    typeof TextDecoder === 'undefined'
  )
    return 'browser';
  try {
    if (!globalThis.indexedDB) return 'storage';
    // Probe real writes: private windows and embedded browsers can expose an
    // IndexedDB object while refusing storage. No record database is modified.
    return await new Promise<DeviceIssue | null>((resolve) => {
      let finished = false;
      let database: IDBDatabase | undefined;
      const finish = (issue: DeviceIssue | null) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        database?.close();
        resolve(issue);
      };
      const timer = setTimeout(() => finish('storage'), 5000);
      let request: IDBOpenDBRequest;
      try {
        request = indexedDB.open('smriva-device-check', 1);
      } catch {
        finish('storage');
        return;
      }
      request.onupgradeneeded = () => request.result.createObjectStore('probe');
      request.onerror = () => finish('storage');
      request.onsuccess = () => {
        database = request.result;
        if (finished) {
          database.close();
          return;
        }
        database.onversionchange = () => database?.close();
        try {
          const transaction = database.transaction('probe', 'readwrite');
          transaction.objectStore('probe').put(true, 'write-check');
          transaction.objectStore('probe').delete('write-check');
          transaction.oncomplete = () => finish(null);
          transaction.onabort = () => finish('storage');
          transaction.onerror = () => finish('storage');
        } catch {
          finish('storage');
        }
      };
    });
  } catch {
    return 'storage';
  }
}
