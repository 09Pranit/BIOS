import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { seedOperations } from '../../packages/content/seed';
import { makeOp, signOperation, union } from '../../packages/sync-core/src/index';
import { createKeys, seal, open } from '../../packages/sync-core/src/crypto';

for (const demo of [true, false]) {
  test(`existing workspace with 35 pending writes and rejected sync: demo=${demo}`, async ({ page }) => {
    const legacy = seedOperations().filter((op) => op.deviceId === 'seed');
    const identity = {
      deviceId: 'device-existing-browser',
      actorId: 'Existing workspace check',
      role: 'Reviewer',
      token: randomBytes(32).toString('hex'),
      recovery: randomBytes(18).toString('base64url'),
      expires: Date.now() - 3600000,
      schoolId: 'kuka-demo-school',
    };
    const ops = [...legacy];
    for (let i = 0; i < 35; i++)
      ops.push(
        await signOperation(
          makeOp(
            ops,
            identity.deviceId,
            identity.actorId,
            `pending-assessment-${i}`,
            'score',
            i,
            'set',
            'assessment',
          ),
          identity.token,
        ),
      );
    const original = {
      identity,
      ops,
      acked: legacy.map((op) => op.opId),
      cursor: legacy.length,
      lastSync: Date.parse('2026-11-01T02:00:00+05:30'),
      report: null,
      quarantined: [],
      entryDrafts: { 'unfinished-note': 'Keep this local draft' },
    };
    const keys = await createKeys('123456');
    const fixture = {
      meta: { id: 'keys', salt: keys.salt, wrapped: keys.wrapped },
      saved: { id: 'state', sealed: await seal(keys.key, original), revision: 1 },
    };
    let enrollments = 0;
    page.on('request', (request) => {
      if (request.url().endsWith('/api/enroll')) enrollments++;
    });
    await page.route('**/api/health', (route) => route.fulfill({ json: { status: 'ok', demo } }));
    for (const endpoint of ['sync', 'session/renew'])
      await page.route(`**/api/${endpoint}`, (route) =>
        route.fulfill({ status: 401, json: { error: 'Device session expired. Recover or enroll online.' } }),
      );
    await page.goto(process.env.DEMO_CONFLICT_TEST_URL ?? '/app/conflicts');
    await expect(page.getByRole('heading', { name: 'Set up this device', exact: true })).toBeVisible();
    // Populate only this isolated browser with a pre-update encrypted workspace.
    await page.evaluate(async (fixture) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('kuka-main');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(['meta', 'vault'], 'readwrite');
          tx.objectStore('meta').put(fixture.meta);
          tx.objectStore('vault').put(fixture.saved);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    }, fixture);
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.reload();
      await page.getByLabel('Device PIN', { exact: true }).fill('123456');
      await page.getByRole('button', { name: 'Unlock workspace', exact: true }).click();
      await expect(page.locator('.connection-pill')).toContainText('Sync failed');
      await expect(page.getByRole('link', { name: '35 pending', exact: true })).toBeVisible();
      if (demo) {
        for (const name of ['Aarohi Kaur', 'Kabir Singh', 'Meher Kaur']) {
          const panel = page
            .locator('.panel')
            .filter({ has: page.getByRole('heading', { name: `${name} · score`, exact: true }) });
          await expect(panel.getByText('Synthetic demo conflict', { exact: true })).toBeVisible();
          await expect(panel.locator('.conflict-versions article')).toHaveCount(2);
        }
      } else
        await expect(
          page.getByRole('heading', { name: 'No unresolved conflicts', exact: true }),
        ).toBeVisible();
    }
    const saved = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('kuka-main');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      try {
        return await new Promise<any>((resolve, reject) => {
          const request = db.transaction('vault').objectStore('vault').get('state');
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } finally {
        db.close();
      }
    });
    const restored = await open<typeof original>(keys.key, saved.sealed);
    expect(union(restored.ops.filter((op) => !op.deviceId.startsWith('seed-conflict-')))).toEqual(
      union(original.ops),
    );
    expect(restored.ops.length - original.ops.length).toBe(demo ? 6 : 0);
    expect(restored.identity).toEqual(original.identity);
    expect(restored.acked).toEqual(original.acked);
    expect(restored.cursor).toBe(original.cursor);
    expect(restored.lastSync).toBe(original.lastSync);
    expect(restored.entryDrafts).toEqual(original.entryDrafts);
    expect(enrollments).toBe(0);
    if (demo) await page.screenshot({ path: '.tools/expired-workspace-conflicts.png', fullPage: true });
  });
}
