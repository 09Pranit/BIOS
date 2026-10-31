import type {ScoringTruth,Interval} from '../packages/simulator/src/types.js';
export function kendall(order:string[],truth:string[]){const rank=new Map(truth.map((id,i)=>[id,i]));const a=order.filter(id=>rank.has(id));let concordant=0,discordant=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){if(rank.get(a[i])!<rank.get(a[j])!)concordant++;else discordant++;}return concordant+discordant?(concordant-discordant)/(concordant+discordant):0;}
export function evidenceScore(cited:string[],truth:ScoringTruth){const relevant=new Set(truth.relevant_ids);const unique=[...new Set(cited)];const tp=unique.filter(id=>relevant.has(id)).length;return {precision:unique.length?tp/unique.length:0,recall:relevant.size?tp/relevant.size:0};}
export const midpoint=(a:Interval)=>(a[0]+a[1])/2;
