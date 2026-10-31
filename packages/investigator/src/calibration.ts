import type {Calibration,Hypothesis} from './types.js';
import {softmax} from './hypotheses.js';
export interface CalibrationRow { probabilities:number[]; target:number }
export function fitTemperature(rows:CalibrationRow[],fit_seeds:number[]=[],test_seeds:number[]=[]):Calibration{
 let best=1,loss=Infinity;for(let t=0.25;t<=4;t+=0.025){let nll=0;for(const r of rows){const p=softmax(r.probabilities.map(x=>Math.log(Math.max(x,1e-12))),t);nll-=Math.log(Math.max(p[r.target],1e-12));}const confidenceRows=rows.map(r=>{const ps=softmax(r.probabilities.map(x=>Math.log(Math.max(x,1e-12))),t);const top=ps.indexOf(Math.max(...ps));return {confidence:ps[top],correct:Number(top===r.target)};});const objective=ece(confidenceRows)+0.0001*nll/Math.max(1,rows.length);if(objective<loss){loss=objective;best=t;}}
 return {method:'temperature',temperature:best,fitted_cases:rows.length,fit_seeds,test_seeds,created_at:new Date().toISOString()};
}
export function calibrate(hs:Hypothesis[],model?:Calibration){const ps=softmax(hs.map(h=>Math.log(Math.max(h.raw,1e-12))),model?.temperature||1);return hs.map((h,i)=>({...h,calibrated:ps[i]}));}
export function reliability(rows:{confidence:number;correct:number}[],bins=10){return Array.from({length:bins},(_,i)=>{const lo=i/bins,hi=(i+1)/bins;const subset=rows.filter(r=>r.confidence>=lo&&(i===bins-1?r.confidence<=hi:r.confidence<hi));return {bin:i,lo,hi,count:subset.length,confidence:subset.length?subset.reduce((s,r)=>s+r.confidence,0)/subset.length:0,accuracy:subset.length?subset.reduce((s,r)=>s+r.correct,0)/subset.length:0};});}
export function ece(rows:{confidence:number;correct:number}[]){return reliability(rows).reduce((s,b)=>s+b.count/Math.max(1,rows.length)*Math.abs(b.confidence-b.accuracy),0);}
export function brier(rows:CalibrationRow[]){return rows.reduce((sum,r)=>sum+r.probabilities.reduce((s,p,i)=>s+(p-(i===r.target?1:0))**2,0),0)/Math.max(1,rows.length);}
