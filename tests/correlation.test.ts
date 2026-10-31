import {it,expect} from 'vitest';
import {simulate} from '../packages/simulator/src/index.js';
import {ingest} from '../packages/investigator/src/ingest.js';
import {estimateSkew,correctClocks} from '../packages/investigator/src/skew.js';
import {correlate,findGaps,classifyGap,gapEvents} from '../packages/investigator/src/correlate.js';
it('correlates when trace IDs disappear and makes loss explicit',()=>{const {telemetry}=simulate('pool',4,{traceDrop:100,logLoss:35,burstLoss:true});const e=ingest(telemetry.records);const corrected=correctClocks(e,estimateSkew(e,telemetry));const links=correlate(corrected);expect(links.length).toBeGreaterThan(20);expect(links.every(l=>l.method==='probabilistic')).toBe(true);const gaps=findGaps(corrected,links);expect(gaps.length).toBeGreaterThan(20);expect(gapEvents(gaps).every(e=>e.kind==='UNOBSERVED')).toBe(true);});
it('distinguishes live-but-silent, down and lost logs',()=>{expect(classifyGap(true,false,true)).toBe('log loss');expect(classifyGap(false,false,false)).toBe('service down');expect(classifyGap(true,false,false)).toBe('never received');});
