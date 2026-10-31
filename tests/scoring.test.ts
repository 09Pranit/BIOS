import {it,expect} from 'vitest';
import {kendall,evidenceScore} from '../scripts/scoring.js';
import {simulate} from '../packages/simulator/src/index.js';
it('scores causal order and irrelevant citations honestly',()=>{const {scoring}=simulate();const order=scoring.causal_order;expect(kendall(order,order)).toBe(1);expect(kendall([...order].reverse(),order)).toBe(-1);expect(evidenceScore([scoring.relevant_ids[0],'fake'],scoring).precision).toBe(0.5);});
