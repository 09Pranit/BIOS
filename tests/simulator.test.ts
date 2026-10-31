import { describe,it,expect } from 'vitest';
import {simulate,scenarios} from '../packages/simulator/src/index.js';
describe('seeded simulator',()=>{
 it('is deterministic and emits all formats with separate scoring',()=>{const a=simulate('pool',12);expect(a).toEqual(simulate('pool',12));expect(new Set(a.telemetry.records.map(r=>r.format)).size).toBe(3);expect(a.telemetry).not.toHaveProperty('faults');expect(a.scoring.faults[0].component).toBe('records-db');});
 it('has replayable causal order and real missing sequence numbers',()=>{for(const s of scenarios){const {telemetry,scoring}=simulate(s.id,3,{logLoss:60});expect(scoring.causal_order.length).toBeGreaterThan(10);expect(telemetry.records.length).toBeGreaterThan(300);expect(scoring.relevant_ids.length).toBeGreaterThan(100);}});
});
