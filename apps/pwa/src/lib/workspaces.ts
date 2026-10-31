/** This registry contains only workspace names; encrypted records remain in IndexedDB. */
export type WorkspaceEntry = { name: string; label: string };
type Registry = { active: string; entries: WorkspaceEntry[] };
const registryKey = 'setusync-workspaces-v1';
const maximumWorkspaces = 50;
const workspaceName =
  /^(?:main|(?:demo|recovered)-[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/;
const validName = (name: unknown): name is string =>
  typeof name === 'string' && name.length <= 100 && workspaceName.test(name);
const original = (): WorkspaceEntry => ({ name: 'main', label: 'Original workspace' });
const emptyRegistry = (): Registry => ({ active: 'main', entries: [original()] });
const defaultLabel = (name: string) =>
  name === 'main'
    ? 'Original workspace'
    : name.startsWith('demo-')
      ? 'Separate demo workspace'
      : 'Recovered workspace';

function parseRegistry(raw: string | null): Registry {
  if (!raw) return emptyRegistry();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyRegistry();
    const value = parsed as Registry;
    if (!validName(value.active) || !Array.isArray(value.entries) || value.entries.length > maximumWorkspaces)
      return emptyRegistry();
    const entries: WorkspaceEntry[] = [];
    for (const entry of value.entries) {
      if (
        !entry ||
        !validName(entry.name) ||
        typeof entry.label !== 'string' ||
        !entry.label.trim() ||
        entry.label.length > 80 ||
        entries.some((item) => item.name === entry.name)
      )
        return emptyRegistry();
      entries.push({ name: entry.name, label: entry.name === 'main' ? original().label : entry.label });
    }
    if (!entries.some((entry) => entry.name === value.active)) return emptyRegistry();
    if (!entries.some((entry) => entry.name === 'main')) entries.unshift(original());
    if (entries.length > maximumWorkspaces) return emptyRegistry();
    return { active: value.active, entries };
  } catch {
    return emptyRegistry();
  }
}

function readRegistry(): Registry {
  try {
    return parseRegistry(globalThis.localStorage?.getItem(registryKey) ?? null);
  } catch {
    return emptyRegistry();
  }
}

export function getActiveWorkspaceName(): string {
  return readRegistry().active;
}

export function listWorkspaces(): WorkspaceEntry[] {
  return readRegistry().entries;
}

/** Persist before switching databases so a reload can find the selected workspace. */
export function rememberActiveWorkspace(name: string, label?: string): void {
  if (!validName(name)) throw new Error('Unsupported workspace name. The current workspace was not changed.');
  let storage: Storage;
  let registry: Registry;
  try {
    storage = globalThis.localStorage;
    if (!storage) throw new Error('Storage unavailable');
    registry = parseRegistry(storage.getItem(registryKey));
  } catch {
    throw new Error('Browser storage is unavailable. Allow site storage before switching workspaces.');
  }
  const existing = registry.entries.find((entry) => entry.name === name);
  if (!existing && registry.entries.length >= maximumWorkspaces)
    throw new Error(
      'This browser already has 50 preserved workspaces. Use a separate browser profile for another workspace.',
    );
  const entryLabel =
    name === 'main' ? original().label : label?.trim().slice(0, 80) || existing?.label || defaultLabel(name);
  const entries = existing
    ? registry.entries.map((entry) => (entry.name === name ? { name, label: entryLabel } : entry))
    : [...registry.entries, { name, label: entryLabel }];
  try {
    storage.setItem(registryKey, JSON.stringify({ active: name, entries } satisfies Registry));
  } catch {
    throw new Error(
      'The workspace selection could not be saved. Free browser storage and retry; the current workspace was not changed.',
    );
  }
}
