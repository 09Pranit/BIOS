import {effect,replay,random} from '../../simulator/src/model.js';
import type {Fault,Telemetry,Interval} from '../../simulator/src/types.js';
import type {Event,Hypothesis,Counterfactual} from './types.js';
import {center} from './correlate.js';
import {normalize} from './hypotheses.js';
export function verdict(reproduction:number,ci:Interval):Counterfactual['verdict']{return reproduction<0.42?'REFUTED':reproduction>=0.72&&ci[0]>0.2?'SUPPORTED':'INCONCLUSIVE';}
export function testCounterfactual(h:Hypothesis,events:Event[],data:Pick<Telemetry,'start'|'workload'>,context:Hypothesis[]=[]):Counterfactual{
 const seeds=[103,211,307,401,503,601,701,809];
 if(h.component==='unknown'||h.fault==='unknown')return {verdict:'INCONCLUSIVE',reproduction:0,reduction:0,ci:[0,1],intervention:'Request discriminating evidence',seeds,curves:[],limitation:'An unmodelled cause cannot be tested by this twin.'};
 const fault:Fault={component:h.component,fault:h.fault,onset:(h.onset[0]+h.onset[1])/2-data.start};
 const background:Fault[]=context.filter(x=>x.id!==h.id&&x.component!=='unknown'&&x.fault!=='unknown'&&x.support.length>4&&!x.propagation_path.includes(h.component as never)&&!h.propagation_path.includes(x.component as never)).map(x=>({component:x.component as Fault['component'],fault:x.fault as Fault['fault'],onset:(x.onset[0]+x.onset[1])/2-data.start}));
 const faults=[fault,...background];
 const observed=events.filter(e=>e.fields.kind==='metric'&&['error_rate','latency_ms'].includes(e.fields.metric!));
 let squared=0;for(const e of observed){const modeled=effect(e.service,center(e)-data.start,faults);const delta=e.fields.metric==='error_rate'?e.fields.value!-modeled.error:(e.fields.value!-modeled.latency)/3000;squared+=delta*delta;}
 const reproduction=observed.length?Math.exp(-5*Math.sqrt(squared/observed.length)):0;
 const reductions=seeds.map(seed=>{const factual=replay(faults,data.workload,seed),cure=replay(background,data.workload,seed+1);const a=factual.reduce((s,v)=>s+v.error*v.requests,0),b=cure.reduce((s,v)=>s+v.error*v.requests,0);return Math.max(-1,Math.min(1,(a-b)/Math.max(a,0.01)));});
 const reduction=reductions.reduce((a,b)=>a+b,0)/seeds.length;const sd=Math.sqrt(reductions.reduce((s,x)=>s+(x-reduction)**2,0)/(seeds.length-1));const ci:Interval=[Math.max(-1,reduction-2.365*sd/Math.sqrt(seeds.length)),Math.min(1,reduction+2.365*sd/Math.sqrt(seeds.length))];
 const rng=random(919);const reproduced=replay(faults,data.workload,103),cured=replay(background,data.workload,104);
 const curves=reproduced.map((v,i)=>{const close=observed.filter(e=>e.service==='api-gateway'&&e.fields.metric==='error_rate').sort((a,b)=>Math.abs(center(a)-data.start-v.t)-Math.abs(center(b)-data.start-v.t))[0];return {t:v.t/1000,factual:close?.fields.value??0,reproduction:v.error,cured:cured[i].error+rng()*0.001};});
 const intervention=h.fault==='pool-exhaustion'?'do(restore previous config / add capacity)':h.fault==='external-outage'?'do(restore bank adapter / disable retries)':h.fault==='certificate-expiry'?'do(renew certificate)':h.fault==='memory-leak'?'do(rollback deployment)':'do(isolate notification worker pool)';
 return {verdict:verdict(reproduction,ci),reproduction,reduction,ci,intervention,seeds,curves,limitation:'Conditional on this simplified queue/latency model and inferred background faults. Student-t interval covers replay noise, not model error. Reproduction and cure are tests of compatibility, not proof of real-world causation.'};
}
export function counterfactualUpdate(hs:Hypothesis[],events:Event[],data:Pick<Telemetry,'start'|'workload'>){const tested=hs.slice(0,4);return normalize(hs.map(h=>{if(!tested.includes(h))return h;const cf=testCounterfactual(h,events,data,tested);return {...h,counterfactual:cf,likelihood:h.likelihood*(cf.verdict==='SUPPORTED'?1.7:cf.verdict==='REFUTED'?0.12:0.8)};}));}
