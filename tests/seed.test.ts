import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import {
  demoPatients,
  seedConflictOperations,
  seedDoctorOperations,
  seedOperations,
} from '../packages/content/seed';
import { materialize, makeOp, signOperation } from '../packages/sync-core/src/index';
import { exportBackup } from '../packages/sync-core/src/crypto';
import { HubStore } from '../apps/hub/src/store';
import { Vault } from '../apps/pwa/src/lib/vault';

describe('fictional patient demo records', () => {
  it('links three real conflicts to existing names and keeps a reviewed example resolved after reseeding', async () => {
    const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
    try {
      store.ingest(seedOperations(), undefined, true);
      const before = materialize(store.all());
      expect(before.conflicts).toHaveLength(3);
      expect(
        before.conflicts.map((conflict) => before.entities[conflict.entityId.split(':')[0]].name),
      ).toEqual(['Aarohi Kaur', 'Kabir Singh', 'Meher Kaur']);
      expect(before.conflicts.every((conflict) => conflict.versions.length === 2)).toBe(true);
      const originalStudents = Object.values(before.entities).filter((record) => record.type === 'child');
      const reviewer = store.enroll('Demo reviewer', 'Reviewer');
      const conflict = before.conflicts[0];
      const resolution = await signOperation(
        makeOp(
          store.all(),
          reviewer.deviceId,
          reviewer.actorId,
          conflict.entityId,
          'score',
          78,
          'resolve',
          'assessment',
        ),
        reviewer.token,
      );
      store.ingest([resolution]);
      store.ingest(seedConflictOperations(), undefined, true);
      const after = materialize(store.all());
      expect(after.conflicts).toHaveLength(2);
      expect(after.entities[conflict.entityId].score).toBe(78);
      expect(store.all().filter((op) => op.entityId === conflict.entityId)).toHaveLength(3);
      expect(Object.values(after.entities).filter((record) => record.type === 'child')).toEqual(
        originalStudents,
      );
    } finally {
      store.close();
    }
  });

  it('does not allow clients to upload conflict seeds', () => {
    const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
    try {
      expect(() => store.ingest(seedConflictOperations())).toThrow('Seed operations cannot be uploaded');
    } finally {
      store.close();
    }
  });
  it('adds named visits separately from the unchanged student roster', () => {
    const records = Object.values(materialize(seedOperations()).entities);
    expect(records.filter((record) => record.type === 'child')).toHaveLength(24);
    const visits = records.filter((record) => record.type === 'doctor-entry');
    expect(visits).toHaveLength(12);
    expect(visits.map((record) => record.doctorEntry[0].patientName).sort()).toEqual(
      demoPatients.map(([name]) => name).sort(),
    );
    expect(seedDoctorOperations()).toEqual(seedDoctorOperations());
    expect(visits.every((record) => record.doctorEntry[0].purpose.includes('Fictional demo'))).toBe(true);
  });

  it('upgrades an existing demo repeatedly without rewriting old records or duplicating visits', () => {
    const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
    try {
      const legacy = seedOperations().filter((op) => op.deviceId === 'seed');
      // Older installations used different village labels under the same seed IDs.
      for (const op of legacy) if (op.field === 'village') op.value = 'Dhareri';
      store.ingest(legacy, undefined, true);
      const before = store.db.prepare('SELECT op_id, body FROM operations ORDER BY seq').all();
      store.ingest(seedDoctorOperations(), undefined, true);
      store.ingest(seedDoctorOperations(), undefined, true);
      expect(store.all()).toHaveLength(legacy.length + 12);
      expect(
        store.db.prepare('SELECT op_id, body FROM operations ORDER BY seq').all().slice(0, legacy.length),
      ).toEqual(before);
      expect(materialize(store.all()).entities['child-001'].village).toBe('Dhareri');
    } finally {
      store.close();
    }
  });

  it('rejects patient seed uploads from clients', () => {
    const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
    try {
      expect(() => store.ingest(seedDoctorOperations())).toThrow('Seed operations cannot be uploaded');
      expect(store.all()).toHaveLength(0);
    } finally {
      store.close();
    }
  });

  it('restores patient demo backups without queuing trusted seeds for upload', async () => {
    const store = new HubStore(':memory:', randomBytes(32).toString('hex'));
    const vault = new Vault('seed-backup-' + randomUUID());
    try {
      await vault.create('123456', store.enroll('Demo backup test', 'Reviewer'));
      const backup = await exportBackup(
        { ops: [...seedDoctorOperations(), ...seedConflictOperations()] },
        'demo-backup-passphrase',
      );
      await vault.import(backup, 'demo-backup-passphrase');
      expect(vault.pending).toHaveLength(0);
      vault.lock();
      await vault.unlock('123456');
      expect(vault.view.entities['demo-doctor-entry-001'].doctorEntry[0].patientName).toBe('Harpreet Singh');
    } finally {
      await vault.destroy();
      store.close();
    }
  });
});
