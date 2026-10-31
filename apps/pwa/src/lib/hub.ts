import { vault } from './vault';
import { newId, timeoutSignal } from './platform';
export type HubOptions = { method?: string; body?: unknown; idempotencyKey?: string };
/** Business writes enter the same durable log; this helper never reports a local save. */
export async function hub<T = any>(path: string, options: HubOptions = {}): Promise<T> {
  if (!vault.state) throw new Error('Unlock this device before contacting the hub.');
  const method = options.method ?? (options.body === undefined ? 'GET' : 'POST'),
    mutating = !['GET', 'HEAD'].includes(method);
  const requestKey = options.idempotencyKey ?? (mutating ? newId() : undefined);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + vault.state.identity.token,
  };
  if (requestKey) headers['Idempotency-Key'] = requestKey;
  const run = async () => {
    const response = await fetch('/api/' + path.replace(/^\//, ''), {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: timeoutSignal(15000),
    });
    const value = await response.json();
    if (!response.ok) {
      const detail = Array.isArray(value.details)
        ? value.details.map((item: any) => [item.path, item.message].filter(Boolean).join(': ')).join('; ')
        : '';
      const error = new Error(detail || value.error || 'The hub request failed.') as Error & {
        status?: number;
        details?: unknown;
      };
      error.status = response.status;
      error.details = value.details;
      throw error;
    }
    return value as T;
  };
  try {
    return await run();
  } catch (error: any) {
    if (mutating && ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)) {
      try {
        return await run();
      } catch (retry: any) {
        throw new Error(
          retry.message?.includes('fetch')
            ? 'The hub is not reachable. No hub-save confirmation was received. Retry when connected; use offline entry to keep working.'
            : retry.message,
        );
      }
    }
    throw new Error(
      error.message?.includes('fetch')
        ? 'The hub is not reachable. Open offline data entry, or reconnect and retry.'
        : error.message,
    );
  }
}
