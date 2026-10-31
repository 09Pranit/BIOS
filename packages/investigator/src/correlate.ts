import type {Event,Link,Gap} from './types.js';
import type {Interval} from '../../simulator/src/types.js';
export const center=(e:Event)=>(e.corrected_ts[0]+e.corrected_ts[1])/2;
export function correlate(events:Event[]):Link[]{
 const links:Link[]=[];const receives=events.filter(e=>e.fields.phase==='receive');
 for(const s of events.filter(e=>e.fields.phase==='send')){
  const direct=receives.find(r=>s.fields.trace&&r.fields.trace===s.fields.trace&&r.service===s.fields.peer);
  if(direct){links.push({from:s.event_id,to:direct.event_id,confidence:0.99,method:'trace',reasoning:'Shared propagated trace and declared dependency'});continue;}
  const candidates=receives.filter(r=>r.service===s.fields.peer&&r.fields.op===s.fields.op&&r.corrected_ts[0]<=s.corrected_ts[1]+1000&&r.corrected_ts[1]>=s.corrected_ts[0]-50).map(r=>({r,score:Math.exp(-Math.abs(center(r)-center(s))/500)*(s.fields.request&&s.fields.request===r.fields.request?0.95:0.65)})).sort((a,b)=>b.score-a.score);
  if(candidates[0])links.push({from:s.event_id,to:candidates[0].r.event_id,confidence:candidates[0].score/(1+(candidates[1]?.score||0)),method:'probabilistic',reasoning:'Corrected intervals, operation, peer and available request hints; ambiguity penalized'});
 }
 return links;
}
export function classifyGap(heartbeat:boolean,metricsAlive:boolean,ingressSeen:boolean):Gap['classification']{return heartbeat||metricsAlive?(ingressSeen?'log loss':'never received'):'service down';}
export function findGaps(events:Event[],links:Link[]):Gap[]{
 const gaps:Gap[]=[];const serviceNames=[...new Set(events.map(e=>e.service))];
 for(const service of serviceNames){const es=events.filter(e=>e.service===service).sort((a,b)=>a.fields.seq-b.fields.seq);for(let i=1;i<es.length;i++){const a=es[i-1],b=es[i],missing=b.fields.seq-a.fields.seq-1;if(missing<1)continue;const interval:Interval=[Math.min(a.corrected_ts[0],b.corrected_ts[0]),Math.max(a.corrected_ts[1],b.corrected_ts[1])];const nearby=es.filter(e=>center(e)>=interval[0]-10000&&center(e)<=interval[1]+10000);const alive=nearby.some(e=>e.fields.op==='heartbeat');const metrics=nearby.some(e=>e.fields.kind==='metric');gaps.push({id:`GAP-${service}-${a.fields.seq}`,service,interval,classification:classifyGap(alive,metrics,true),evidence_ids:[a.event_id,b.event_id],missing_count:missing,justification:`Sequence ${a.fields.seq} → ${b.fields.seq}; ${alive?'heartbeat observed':metrics?'metrics still sampled':'no independent liveness signal'}. Sequence allocation spans all streams; buffered timestamps may arrive out of order.`});}}
 const linked=new Set(links.map(l=>l.from));for(const e of events.filter(e=>e.fields.phase==='send'&&!linked.has(e.event_id))){const service=e.fields.peer!;const nearby=events.filter(r=>r.service===service&&Math.abs(center(r)-center(e))<15000);const heartbeat=nearby.some(r=>r.fields.op==='heartbeat');const metrics=nearby.some(r=>r.fields.kind==='metric');const ingress=nearby.some(r=>r.fields.phase==='reply'&&r.fields.request===e.fields.request);gaps.push({id:`GAP-call-${e.event_id}`,service,interval:[e.corrected_ts[0],e.corrected_ts[1]+1000],classification:classifyGap(heartbeat,metrics,ingress),evidence_ids:[e.event_id,...nearby.slice(0,2).map(r=>r.event_id)],missing_count:1,justification:ingress?'Reply survives but receive log is absent.':heartbeat||metrics?'Caller send survives; callee is alive, but receipt cannot be established.':'Caller send survives; no callee liveness signal in the observation window.'});}
 return gaps;
}
export function gapEvents(gaps:Gap[]):Event[]{return gaps.map(g=>({event_id:`INFERRED-UNOBSERVED-${g.id}`,service:g.service,raw_ts:'unobserved',raw_line:g.justification,source_file:'derived/gap-reasoning',line:0,format:'json',fields:{kind:'log',seq:0,op:'inferred-gap',level:'unknown',message:g.justification},content_hash:'unobserved',parsed_ts:(g.interval[0]+g.interval[1])/2,corrected_ts:g.interval,kind:'UNOBSERVED'}));}
