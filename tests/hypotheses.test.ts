import {it,expect} from 'vitest';
import {simulate,scenarios} from '../packages/simulator/src/index.js';
import {ingest} from '../packages/investigator/src/ingest.js';
import {estimateSkew,correctClocks} from '../packages/investigator/src/skew.js';
import {rankHypotheses} from '../packages/investigator/src/hypotheses.js';
it('ranks fixture causes and retains normalized unknown probability',()=>{for(const s of scenarios){const {telemetry,scoring}=simulate(s.id,42);const e=ingest(telemetry.records);const h=rankHypotheses(correctClocks(e,estimateSkew(e,telemetry)));expect(h[0].component).toBe(scoring.faults[0].component);expect(h.reduce((n,x)=>n+x.raw,0)).toBeCloseTo(1);expect(h.find(x=>x.id==='H-unknown')!.raw).toBeGreaterThan(0);expect(h[0].support.length).toBeGreaterThan(0);}});
it('lowers confidence when evidence disappears',()=>{const {telemetry}=simulate();const e=ingest(telemetry.records),c=correctClocks(e,estimateSkew(e,telemetry));const dense=rankHypotheses(c);const sparse=rankHypotheses(c.filter((e,i)=>i%4===0));expect(sparse[0].raw).toBeLessThan(dense[0].raw);});
