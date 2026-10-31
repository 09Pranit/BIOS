import {services,type Service,type Telemetry} from '../../simulator/src/types.js';
import type {Event,SkewEstimate,SkewWindow} from './types.js';
interface Constraint {a:Service;b:Service;upper:number}
function shortest(edges:Constraint[],source:Service){const d=Object.fromEntries(services.map(s=>[s,s===source?0:Infinity])) as Record<Service,number>;for(let i=0;i<services.length-1;i++){let changed=false;for(const e of edges)if(d[e.b]>d[e.a]+e.upper){d[e.b]=d[e.a]+e.upper;changed=true;}if(!changed)break;}return d;}
export function estimateSkew(events:Event[],data:Pick<Telemetry,'start'|'duration'|'clockReference'>):SkewEstimate[]{
 const groups=new Map<string,Event[]>();for(const e of events)if(e.fields.request){const g=groups.get(e.fields.request)||[];g.push(e);groups.set(e.fields.request,g);}
 const all=[...groups.values()].map(g=>({s:g.find(e=>e.fields.phase==='send'),r:g.find(e=>e.fields.phase==='receive'),t:g.find(e=>e.fields.phase==='reply'),u:g.find(e=>e.fields.phase==='complete')}));
 const byService=Object.fromEntries(services.map(s=>[s,[] as SkewWindow[]])) as Record<Service,SkewWindow[]>;
 for(let time=0;time<=data.duration;time+=60000){
  const pairs=all;const edges:Constraint[]=[];const count=Object.fromEntries(services.map(s=>[s,0])) as Record<Service,number>;
  for(const p of pairs){const caller=p.s||p.u;const callee=p.r||p.t;if(!caller||!callee)continue;const a=caller.service;const b=callee.service;const slack=120+Math.abs(caller.parsed_ts-data.start-time)*0.0005; // bounds slow drift over a window; conservative transport floor = 1 ms
   if(p.s&&p.r){edges.push({a,b,upper:p.r.parsed_ts-p.s.parsed_ts-1+slack});count[a]++;count[b]++;}
   if(p.t&&p.u){edges.push({a:b,b:a,upper:p.u.parsed_ts-p.t.parsed_ts-1+slack});count[a]++;count[b]++;}
  }
  for(const s of services)if(s!==data.clockReference){edges.push({a:data.clockReference,b:s,upper:60000},{a:s,b:data.clockReference,upper:60000});}
  const upper=shortest(edges,data.clockReference);const reverse=shortest(edges.map(e=>({a:e.b,b:e.a,upper:e.upper})),data.clockReference);
  for(const s of services){let lo=s===data.clockReference?-1:-reverse[s],hi=s===data.clockReference?1:upper[s];if(lo>hi){lo=-60000;hi=60000;}byService[s].push({time:data.start+time,offset:(lo+hi)/2,interval:[lo,hi],pairs:count[s]});}
 }
 return services.map(service=>{const windows=byService[service];const mid=windows[Math.floor(windows.length/2)];const first=windows[0],last=windows.at(-1)!;return {service,offset:mid.offset,interval:mid.interval,drift_ppm:(last.offset-first.offset)/(last.time-first.time)*1e6,windows,reference:data.clockReference,...(windows.some(w=>w.pairs<2)?{warning:'Sparse causal pairs: uncertainty widened; absolute time is relative to gateway.'}:{})};});
}
export function correctClocks(events:Event[],estimates:SkewEstimate[]){return events.map(e=>{const estimate=estimates.find(s=>s.service===e.service)!;const ws=estimate.windows;const time=e.parsed_ts-estimate.offset;const found=ws.findIndex(w=>w.time>=time);const right=found<0?ws.length-1:Math.max(1,found);const a=ws[Math.min(right-1,ws.length-2)],b=ws[Math.min(right,ws.length-1)];const f=Math.max(0,Math.min(1,(time-a.time)/(b.time-a.time)));const lo=a.interval[0]*(1-f)+b.interval[0]*f,hi=a.interval[1]*(1-f)+b.interval[1]*f;return {...e,corrected_ts:[e.parsed_ts-hi,e.parsed_ts-lo] as [number,number]};});}
