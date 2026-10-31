// Only API post-run scoring and the benchmark import this module. Never passed to the agent.
import Database from 'better-sqlite3';
import type {ScoringTruth} from '../../../packages/simulator/src/types.js';
import type {Analysis} from '../../../packages/investigator/src/analyze.js';
import {score} from '../../../scripts/benchmark.js';
export function openScoring(filename:string){const db=new Database(filename);db.exec('CREATE TABLE IF NOT EXISTS scoring_only(case_id TEXT PRIMARY KEY,truth TEXT NOT NULL)');return {save(id:string,truth:ScoringTruth){db.prepare('INSERT OR REPLACE INTO scoring_only(case_id,truth) VALUES(?,?)').run(id,JSON.stringify(truth));},reveal(id:string,analysis:Analysis){const row=db.prepare('SELECT truth FROM scoring_only WHERE case_id=?').get(id) as {truth:string}|undefined;if(!row)return null;const truth=JSON.parse(row.truth) as ScoringTruth;return {metrics:score(analysis,truth),true_causes:truth.faults.map(f=>`${f.component}: ${f.fault}`),note:'Revealed only after investigation. Never supplied to the investigator.'};},close(){db.close();}};}
