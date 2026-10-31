import type { DatabaseSync } from 'node:sqlite';

export const HUB_SCHEMA_VERSION = 1;

/** Upgrade the original operation database in place; never replace records or keys. */
export function migrateHub(db: DatabaseSync, legacySchool: string) {
  const current = Number((db.prepare('PRAGMA user_version').get() as any).user_version);
  if (current > HUB_SCHEMA_VERSION) throw new Error('Database schema is newer than this hub supports.');
  if (current === HUB_SCHEMA_VERSION) return;
  db.exec('BEGIN IMMEDIATE');
  try {
    const addColumn = (table: string, name: string, definition: string) => {
      const columns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      if (!columns.some((column) => column.name === name))
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
    };
    addColumn('devices', 'internal', 'INTEGER NOT NULL DEFAULT 0');
    addColumn('devices', 'parent_device', 'TEXT');
    addColumn('quarantine', 'checksum', 'TEXT');
    addColumn('audit', 'school', 'TEXT');
    addColumn('audit', 'body', 'TEXT');
    db.prepare('UPDATE audit SET school=? WHERE school IS NULL').run(legacySchool);
    db.exec(`
      CREATE INDEX IF NOT EXISTS operations_school_cursor ON operations(school,seq);
      CREATE INDEX IF NOT EXISTS devices_parent ON devices(parent_device);
      CREATE TABLE IF NOT EXISTS materialized_records(
        school TEXT NOT NULL, entity_id TEXT NOT NULL, entity_type TEXT NOT NULL,
        body TEXT NOT NULL, version TEXT NOT NULL, deleted INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL, updated_seq INTEGER NOT NULL,
        PRIMARY KEY(school,entity_id)
      );
      CREATE INDEX IF NOT EXISTS materialized_records_type ON materialized_records(school,entity_type,deleted);
      CREATE TABLE IF NOT EXISTS conflict_projection(
        school TEXT NOT NULL, conflict_id TEXT NOT NULL, entity_id TEXT NOT NULL,
        body TEXT NOT NULL, updated_at INTEGER NOT NULL,
        PRIMARY KEY(school,conflict_id)
      );
      CREATE TABLE IF NOT EXISTS command_receipts(
        school TEXT NOT NULL, device TEXT NOT NULL, request_id TEXT NOT NULL,
        fingerprint TEXT NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL,
        PRIMARY KEY(school,device,request_id)
      );
      CREATE TABLE IF NOT EXISTS invitations(
        code_hash TEXT PRIMARY KEY, school TEXT NOT NULL, role TEXT NOT NULL,
        expires INTEGER NOT NULL, created_by TEXT, created_at INTEGER NOT NULL,
        consumed_at INTEGER, consumed_device TEXT
      );
      CREATE INDEX IF NOT EXISTS audit_school ON audit(school,id);
      PRAGMA user_version=1;
    `);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
