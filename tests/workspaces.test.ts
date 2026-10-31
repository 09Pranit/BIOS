import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getActiveWorkspaceName,
  listWorkspaces,
  rememberActiveWorkspace,
} from '../apps/pwa/src/lib/workspaces';

const registryKey = 'setusync-workspaces-v1';
const demo = 'demo-00000000-0000-4000-8000-000000000001';
const recovered = 'recovered-00000000-0000-4000-8000-000000000002';
let values: Map<string, string>;
let storage: Storage;
beforeEach(() => {
  values = new Map();
  storage = {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    removeItem: vi.fn((key: string) => values.delete(key)),
    clear: vi.fn(() => values.clear()),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    get length() {
      return values.size;
    },
  } as Storage;
  vi.stubGlobal('localStorage', storage);
});
afterEach(() => vi.unstubAllGlobals());

describe('preserved local workspace registry', () => {
  it('keeps the original namespace as the default without writing browser storage', () => {
    expect(getActiveWorkspaceName()).toBe('main');
    expect(listWorkspaces()).toEqual([{ name: 'main', label: 'Original workspace' }]);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
  it('persists independent selections while retaining the original and previously recovered workspaces', () => {
    rememberActiveWorkspace(recovered, 'Recovered records');
    rememberActiveWorkspace(demo, 'A fresh demonstration');
    expect(getActiveWorkspaceName()).toBe(demo);
    expect(listWorkspaces().map((entry) => entry.name)).toEqual(['main', recovered, demo]);
    rememberActiveWorkspace('main');
    expect(getActiveWorkspaceName()).toBe('main');
    expect(listWorkspaces()).toHaveLength(3);
  });
  it('uses bounded display labels and never renames the original workspace', () => {
    rememberActiveWorkspace(demo, 'x'.repeat(100));
    expect(listWorkspaces()[1].label).toHaveLength(80);
    rememberActiveWorkspace(recovered, '   ');
    expect(listWorkspaces()[2].label).toBe('Recovered workspace');
    rememberActiveWorkspace('main', 'Not the original');
    expect(listWorkspaces()[0].label).toBe('Original workspace');
  });
  it('falls back safely for malformed registries or active selections outside the recorded entries', () => {
    for (const raw of [
      '{',
      'null',
      '{}',
      JSON.stringify({ active: recovered, entries: [] }),
      JSON.stringify({ active: '../database', entries: [{ name: 'main', label: 'Original' }] }),
    ]) {
      values.set(registryKey, raw);
      expect(getActiveWorkspaceName()).toBe('main');
      expect(listWorkspaces()).toEqual([{ name: 'main', label: 'Original workspace' }]);
      expect(values.get(registryKey)).toBe(raw);
    }
  });
  it('restores the original entry when reading an otherwise valid registry without it', () => {
    values.set(registryKey, JSON.stringify({ active: demo, entries: [{ name: demo, label: 'Demo' }] }));
    expect(getActiveWorkspaceName()).toBe(demo);
    expect(listWorkspaces()).toEqual([
      { name: 'main', label: 'Original workspace' },
      { name: demo, label: 'Demo' },
    ]);
  });
  it('rejects unsafe names without modifying the persisted selection', () => {
    rememberActiveWorkspace(demo);
    const before = values.get(registryKey);
    for (const name of [
      '../main',
      'kuka-main',
      'demo-arbitrary',
      recovered.toUpperCase(),
      'recovered-00000000-0000-0000-0000-000000000000',
    ])
      expect(() => rememberActiveWorkspace(name)).toThrow('Unsupported workspace name');
    expect(values.get(registryKey)).toBe(before);
  });
  it('does not discard existing workspace pointers when browser storage rejects a write', () => {
    rememberActiveWorkspace(demo);
    const before = values.get(registryKey);
    vi.mocked(storage.setItem).mockImplementationOnce(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => rememberActiveWorkspace(recovered)).toThrow('selection could not be saved');
    expect(values.get(registryKey)).toBe(before);
    expect(getActiveWorkspaceName()).toBe(demo);
  });
  it('reads the original safely when storage is unavailable but refuses to pretend a switch was saved', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(getActiveWorkspaceName()).toBe('main');
    expect(() => rememberActiveWorkspace(demo)).toThrow('Browser storage is unavailable');
  });
  it('rejects a new pointer at the bound while allowing selection of an already preserved workspace', () => {
    const entries = [
      { name: 'main', label: 'Original workspace' },
      ...Array.from({ length: 49 }, (_, index) => ({
        name: `demo-00000000-0000-4000-8000-${index.toString(16).padStart(12, '0')}`,
        label: `Demo ${index}`,
      })),
    ];
    values.set(registryKey, JSON.stringify({ active: 'main', entries }));
    const before = values.get(registryKey);
    expect(() => rememberActiveWorkspace(recovered)).toThrow('50 preserved workspaces');
    expect(values.get(registryKey)).toBe(before);
    rememberActiveWorkspace(entries[1].name);
    expect(getActiveWorkspaceName()).toBe(entries[1].name);
    expect(listWorkspaces()).toHaveLength(50);
  });
});
