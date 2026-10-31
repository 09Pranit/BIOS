import { type Fault, type Service, services, topology } from './types.js';
export function random(seed: number) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7,t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const signatures = { 'pool-exhaustion': {metric:'pool_utilization',base:0.25,peak:0.99,message:'connection pool wait exceeded; active=max',status:503}, 'external-outage':{metric:'availability',base:1,peak:0.03,message:'upstream bank connection refused',status:502}, 'certificate-expiry':{metric:'tls_failure_rate',base:0,peak:0.98,message:'TLS certificate expired; handshake rejected',status:401}, 'blocking-slowdown':{metric:'queue_wait_ms',base:10,peak:3200,message:'delivery acknowledged slowly',status:200}, 'memory-leak':{metric:'heap_ratio',base:0.3,peak:0.98,message:'heap growth; allocation pressure',status:503} } as const;
export function pathTo(from: Service, to: Service, seen: Service[] = []): Service[] | null { if(from===to)return [from]; if(seen.includes(from))return null; for(const [,b] of topology.filter(([a])=>a===from)){const p=pathTo(b,to,[...seen,from]); if(p)return [from,...p];} return null; }
export function effect(service: Service, t: number, faults: Fault[]) {
  let error=0.006, latency=70, pressure=0;
  for(const f of faults){const p=pathTo(service,f.component); if(!p || t < f.onset+(p.length-1)*3000)continue; const rise=f.fault==='memory-leak'?Math.min(1,(t-f.onset)/55000):Math.min(1,(t-f.onset)/8000+0.3); const slow=f.fault==='blocking-slowdown'; pressure=Math.max(pressure,rise); latency+=rise*(slow?2400:1600)/(1+(p.length-1)*0.25); error=Math.max(error,slow&&service===f.component?0.006:rise*(p.length===1?0.83:0.68)); }
  return { error, latency, pressure };
}
// This twin sees behaviour and recorded workload, never scenario IDs or scoring truth.
export function replay(faults: Fault[], workload: {t:number;requests:number}[], seed: number) { const rng=random(seed); return workload.map(w=>{const e=effect('api-gateway',w.t,faults); return {t:w.t,error:Math.max(0,Math.min(1,e.error+(rng()-0.5)*0.025)),latency:e.latency*(0.96+rng()*0.08),requests:w.requests};}); }
export { services };
