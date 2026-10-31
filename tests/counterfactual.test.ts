import {it,expect} from 'vitest';
import {simulate} from '../packages/simulator/src/index.js';
import {ingest} from '../packages/investigator/src/ingest.js';
import {estimateSkew,correctClocks} from '../packages/investigator/src/skew.js';
import {rankHypotheses} from '../packages/investigator/src/hypotheses.js';
import {testCounterfactual,verdict,counterfactualUpdate} from '../packages/investigator/src/counterfactual.js';
it('uses reproduction plus cure uncertainty for verdicts',()=>{expect(verdict(0.9,[0.7,0.9])).toBe('SUPPORTED');expect(verdict(0.2,[0.8,1])).toBe('REFUTED');expect(verdict(0.8,[0.1,0.9])).toBe('INCONCLUSIVE');});
it('reproduces and cures a compatible cause without accessing truth',()=>{const {telemetry}=simulate();const e=ingest(telemetry.records),c=correctClocks(e,estimateSkew(e,telemetry)),hs=rankHypotheses(c);const cf=testCounterfactual(hs[0],c,telemetry);expect(cf.verdict).toBe('SUPPORTED');expect(cf.ci[0]).toBeGreaterThan(0.7);expect(counterfactualUpdate(hs,c,telemetry).reduce((s,h)=>s+h.raw,0)).toBeCloseTo(1);});
