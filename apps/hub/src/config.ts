import { existsSync } from 'node:fs';
export function databasePath() {
  return (
    process.env.DATABASE_PATH ||
    (existsSync('./data/kuka.sqlite') ? './data/kuka.sqlite' : './data/setusync.sqlite')
  );
}
