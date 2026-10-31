import { defaultStress, services, topology, type RawRecord, type Fields, type Stress, type Service, type Scenario, type ScoringTruth, type Telemetry } from './types.js';
import { random, effect, signatures, pathTo } from './model.js';
export * from './types.js';
export const scenarios: Scenario[] = [
 {id:'pool',title:'The narrowing artery',description:'Benefits and appointments begin timing out.',faults:[{component:'records-db',fault:'pool-exhaustion',onset:100000}]},
 {id:'bank',title:'A storm of retries',description:'Payments stall soon after an apparently harmless release.',faults:[{component:'bank-adapter',fault:'external-outage',onset:110000}]},
 {id:'identity',title:'An expired identity',description:'Citizens cannot sign in to essential services.',faults:[{component:'identity-service',fault:'certificate-expiry',onset:95000}]},
 {id:'notification',title:'The quiet obstruction',description:'Appointments stall while the message service reports no errors.',faults:[{component:'notification-gateway',fault:'blocking-slowdown',onset:105000}]},
 {id:'memory',title:'A slow fever',description:'A release appears healthy before appointment memory begins to grow.',faults:[{component:'appointment-service',fault:'memory-leak',onset:110000}]},
 {id:'overlap',title:'Two infections, one body',description:'Sign-in failures overlap with a separate shared-records disruption.',faults:[{component:'records-db',fault:'pool-exhaustion',onset:95000},{component:'identity-service',fault:'certificate-expiry',onset:125000}]}
];
export function simulate(scenarioId='pool', seed=42, input: Partial<Stress> = {}): { telemetry: Telemetry; scoring: ScoringTruth } {
 const scenario=scenarios.find(s=>s.id===scenarioId); if(!scenario)throw new Error('Unknown scenario');
 const stress={...defaultStress,...input}; const rng=random(seed); const start=Date.UTC(2026,9,31,8,0); const duration=240000;
 const offsets=Object.fromEntries(services.map(s=>[s,{offset:s==='api-gateway'?0:(rng()*2-1)*stress.clockOffset*1000,drift:s==='api-gateway'?0:(rng()*2-1)*stress.drift/1e6}])) as ScoringTruth['offsets'];
 const records:RawRecord[]=[]; const event_times:Record<string,number>={}; const relevant_ids:string[]=[]; const counts=Object.fromEntries(services.map(s=>[s,0])) as Record<Service,number>;
 const pending:{service:Service;t:number;part:Partial<Fields>;relevant:boolean}[]=[];
 function emit(service:Service,t:number,part:Partial<Fields>={},relevant=false){pending.push({service,t,part,relevant});}
 function record(service:Service,t:number,part:Partial<Fields>,relevant=false){
  const seq=++counts[service]; const f:Fields={kind:'log',seq,op:'heartbeat',level:'info',message:'service alive',...part};
  const id=`${f.kind==='metric'?'MET':f.kind==='change'?'CHG':'LOG'}-${service}-${String(seq).padStart(5,'0')}`;
  event_times[id]=start+t; if(relevant)relevant_ids.push(id);
  if(f.kind==='log' && (rng()<stress.logLoss/100 || stress.burstLoss&&t>125000&&t<148000&&service!=='api-gateway'))return;
  if(f.trace&&rng()<stress.traceDrop/100){delete f.trace;if(rng()<0.6)delete f.request;}
  const ms=Math.round(start+t+offsets[service].offset+t*offsets[service].drift); const ix=services.indexOf(service); const format=stress.timestampMix?['json','logfmt','pipe'][ix%3] as RawRecord['format']:'json';
  const raw_ts=stress.timestampMix&&ix%3===1?ms:stress.timestampMix&&ix%3===2?new Date(ms).toISOString().replace('Z','+00:00'):new Date(ms).toISOString();
  const raw_line=format==='json'?JSON.stringify(f):format==='pipe'?Object.entries(f).map(([k,v])=>`${k}:${encodeURIComponent(String(v))}`).join('|'):Object.entries(f).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join(' ');
  records.push({event_id:id,service,raw_ts,raw_line,format,source_file:`synthetic/${service}.${format}.log`,line:seq});
 }
 for(let t=0;t<=duration;t+=10000){ for(const [a,b] of topology){const request=`rpc-${t}-${a}-${b}`; const d=4+rng()*18; emit(a,t,{op:`call:${b}`,phase:'send',peer:b,request,trace:request}); emit(b,t+d,{op:`call:${b}`,phase:'receive',peer:a,request,trace:request}); emit(b,t+d+3,{op:`call:${b}`,phase:'reply',peer:a,request,trace:request}); emit(a,t+d*2+3,{op:`call:${b}`,phase:'complete',peer:b,request,trace:request});} }
 const workload=[];
 for(let t=0;t<=duration;t+=5000){workload.push({t,requests:90+Math.floor(rng()*40)}); for(const service of services){const e=effect(service,t,scenario.faults);const rel=scenario.faults.some(f=>!!pathTo(service,f.component)&&t>=f.onset); emit(service,t,{op:'heartbeat'});
  if(t % ((services.indexOf(service)%3+1)*5000)===0){emit(service,t,{kind:'metric',op:'sample',metric:'error_rate',value:Math.max(0,e.error+(rng()-0.5)*stress.noise/100),message:'request failures'},rel);emit(service,t+1,{kind:'metric',op:'sample',metric:'latency_ms',value:e.latency*(0.95+rng()*0.1),message:'latency p95'},rel);}
  if(e.pressure>0.1)emit(service,t+50,{op:'serve',level:e.error>0.1?'error':'info',status:service==='notification-gateway'?200:504,message:service==='bank-adapter'?'bank connection refused':service==='identity-service'?'TLS handshake failed; 401':service==='notification-gateway'?'delivery acknowledged slowly':'dependency deadline exceeded',hint:'citizen-transaction'},rel);
  if(rng()<stress.noise/100)emit(service,t+200,{op:'background',level:'warn',message:'health probe transient; recovered',status:500});
 }}
 for(const f of scenario.faults){ const sig=signatures[f.fault]; const changeTime=f.fault==='memory-leak'?f.onset-35000:f.onset-1500;
  if(f.fault==='pool-exhaustion'||f.fault==='memory-leak')emit(f.component,changeTime,{kind:'change',op:'config',message:f.fault==='pool-exhaustion'?'pool.max changed 64 -> 4':'deployment appointment-v2.8; memory allocator changed'},true);
  for(let t=f.onset;t<=duration;t+=13000)emit(f.component,t+10,{kind:'metric',op:'sample',metric:sig.metric,value:sig.base+(sig.peak-sig.base)*Math.min(1,(t-f.onset+1500)/(f.fault==='memory-leak'?55000:7000)),message:sig.message},true);
  emit(f.component,f.onset+100,{op:'diagnostic',level:f.fault==='blocking-slowdown'?'info':'error',message:sig.message,status:sig.status},true);
 }
 if(scenarioId==='bank')emit('payments-service',60000,{kind:'change',op:'deploy',message:'deployment payments-v1.4; documentation labels only'});
 pending.sort((a,b)=>a.t-b.t||a.service.localeCompare(b.service)).forEach(p=>record(p.service,p.t,p.part,p.relevant));
 const causal_order=relevant_ids.filter(id=>records.some(r=>r.event_id===id)).sort((a,b)=>event_times[a]-event_times[b]);
 return {telemetry:{case_id:`SS-${scenarioId}-${seed}`,records:records.map(r=>({r,k:rng()})).sort((a,b)=>a.k-b.k).map(x=>x.r),topology,workload,clockReference:'api-gateway',duration,start,stress},scoring:{faults:scenario.faults,offsets,event_times,relevant_ids,causal_order}};
}
