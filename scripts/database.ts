import 'dotenv/config';
import { backup, DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { HubStore, loadHubKey } from '../apps/hub/src/store';
import { databasePath } from '../apps/hub/src/config';
import { SCHOOL } from '../packages/sync-core/src/index';
const command = process.argv[2] ?? 'inspect',
  args = process.argv.slice(3),
  option = (name: string, fallback: string) => {
    const index = args.indexOf(name);
    return index < 0 ? fallback : (args[index + 1] ?? fallback);
  };
const path = databasePath();
if (command === 'backup') {
  if (!existsSync(path))
    throw new Error('No database exists at the configured path. Start the hub before taking a snapshot.');
  const target = resolve(
    option('--out', './backups/smriva-' + new Date().toISOString().replace(/[:.]/g, '-') + '.sqlite'),
  );
  if (existsSync(target)) throw new Error('Backup target already exists; refusing to overwrite it.');
  mkdirSync(dirname(target), { recursive: true });
  const source = new DatabaseSync(path, { readOnly: true });
  try {
    const pages = await backup(source, target);
    console.log(
      'SQLite snapshot saved: ' +
        target +
        ' (' +
        pages +
        ' pages). Keep the matching hub key separately; never publish backups or .env.',
    );
  } finally {
    source.close();
  }
} else {
  const store = new HubStore(path, loadHubKey(path, process.env.DEMO_JUDGE_MODE !== 'false'));
  try {
    if (command === 'inspect') {
      const school = SCHOOL,
        check = store.db.prepare('PRAGMA quick_check').all(),
        summary = store.summary(school);
      console.log(
        JSON.stringify(
          {
            database: path,
            schemaVersion: (store.db.prepare('PRAGMA user_version').get() as any)?.user_version,
            integrity: check,
            operations: summary.operations,
            children: store.listRecords({ school, type: 'child', limit: 1 }).total,
            conflicts: summary.conflicts,
            devices: summary.devices.length,
            quarantined: summary.quarantined.length,
            root: summary.root,
          },
          null,
          2,
        ),
      );
    } else if (command === 'invite') {
      const role = option('--role', 'Teacher'),
        hours = Number(option('--hours', '24'));
      if (
        !['Teacher', 'Health Worker', 'Reviewer', 'Hub Admin'].includes(role) ||
        !Number.isInteger(hours) ||
        hours < 1 ||
        hours > 720
      )
        throw new Error('Use a supported role and an expiration from 1 to 720 hours.');
      const invitation = store.createInvitation(role, SCHOOL, hours * 3600000, 'local-operator');
      console.log('One-time enrollment code (keep private): ' + invitation.code);
      console.log('Role: ' + invitation.role + '; expires ' + new Date(invitation.expires).toISOString());
    } else throw new Error('Supported commands: inspect, invite, backup.');
  } finally {
    store.close();
  }
}
