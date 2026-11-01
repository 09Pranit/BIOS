export type PublicRouteMeta = { title: string; description: string };

/** Explicit configuration only: never derive public identity from a request Host header. */
export function parseSiteUrl(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const value = new URL(raw.trim());
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(value.hostname);
    if (
      (value.protocol !== 'https:' && !(local && value.protocol === 'http:')) ||
      value.username ||
      value.password ||
      value.pathname !== '/' ||
      value.search ||
      value.hash
    )
      return undefined;
    return value.origin;
  } catch {
    return undefined;
  }
}

export function publicRouteMeta(path: string): PublicRouteMeta | undefined {
  if (path === '/')
    return {
      title: 'Smriva — Offline-first education records',
      description:
        'Keep school records working offline. Smriva preserves concurrent changes, makes conflicts visible, and synchronizes over weak connections.',
    };
  if (path === '/about')
    return {
      title: 'About Smriva — Sources, security and offline sync',
      description:
        'Inspect Smriva’s offline-first design, government programme sources, encryption, tested synchronization behavior and deployment limits.',
    };
  return undefined;
}
