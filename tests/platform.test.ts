import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkDevice, localCalendarDate, newId, timeoutSignal } from '../apps/pwa/src/lib/platform';
import { translate } from '../apps/pwa/src/lib/i18n';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('browser compatibility', () => {
  it('creates unique secure RFC4122 IDs without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    const ids = new Set(Array.from({ length: 100 }, () => newId()));
    expect(ids.size).toBe(100);
    for (const id of ids)
      expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
  });
  it('retains timeouts when AbortSignal.timeout is missing', () => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(undefined as any);
    Object.defineProperty(AbortSignal, 'timeout', { value: undefined, configurable: true });
    const signal = timeoutSignal(100);
    expect(signal.aborted).toBe(false);
    vi.advanceTimersByTime(100);
    expect(signal.aborted).toBe(true);
    expect(signal.reason.name).toBe('TimeoutError');
  });
  it('does not depend on the browser date-locale output for date inputs', () => {
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue('31/10/2026');
    expect(localCalendarDate(new Date(2026, 9, 31, 23, 59))).toBe('2026-10-31');
    expect(localCalendarDate(new Date(2026, 0, 2))).toBe('2026-01-02');
  });
  it('translates without Object.hasOwn while excluding inherited values', () => {
    vi.spyOn(Object, 'hasOwn').mockImplementation(undefined as any);
    Object.defineProperty(Object, 'hasOwn', { value: undefined, configurable: true });
    expect(translate('hi', '{count}', { count: 0 })).toBe('0');
    expect(translate('en', '{name}', Object.create({ name: 'inherited' }))).toBe('{name}');
  });
  it('checks actual IndexedDB writes before enrolling a device', async () => {
    expect(await checkDevice()).toBe(null);
  });
  it('explains insecure access before creating any record workspace', async () => {
    vi.stubGlobal('isSecureContext', false);
    expect(await checkDevice()).toBe('connection');
  });
  it('explains unavailable browser encryption', async () => {
    vi.stubGlobal('crypto', {});
    expect(await checkDevice()).toBe('browser');
  });
  it('explains storage restrictions without bypassing local encryption', async () => {
    vi.stubGlobal('indexedDB', {
      open: () => {
        throw new DOMException('Denied', 'SecurityError');
      },
    });
    expect(await checkDevice()).toBe('storage');
  });
});
