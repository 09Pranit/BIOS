import type {Telemetry} from '../../simulator/src/types.js';
import type {Calibration} from './types.js';
import {ingest} from './ingest.js';
import {estimateSkew,correctClocks} from './skew.js';
import {correlate,findGaps,gapEvents} from './correlate.js';
import {rankHypotheses} from './hypotheses.js';
import {counterfactualUpdate} from './counterfactual.js';
import {calibrate} from './calibration.js';
export interface AnalysisOptions {skew?:boolean;gaps?:boolean;counterfactuals?:boolean;calibrator?:Calibration}
export function analyze(data:Telemetry,options:AnalysisOptions={}){
 const started=performance.now();const original=ingest(data.records);const skew=estimateSkew(original,data);const events=options.skew===false?original.map(e=>({...e,corrected_ts:[e.parsed_ts-1,e.parsed_ts+1] as [number,number]})):correctClocks(original,skew);const links=correlate(events);const gaps=options.gaps===false?[]:findGaps(events,links);let hypotheses=rankHypotheses(events,gaps,{gapReasoning:options.gaps});if(options.counterfactuals!==false)hypotheses=counterfactualUpdate(hypotheses,events,data);hypotheses=calibrate(hypotheses,options.calibrator);return {events,skew,links,gaps,hypotheses,timeline:[...events,...gapEvents(gaps)].sort((a,b)=>(a.corrected_ts[0]+a.corrected_ts[1])-(b.corrected_ts[0]+b.corrected_ts[1])),seconds:(performance.now()-started)/1000};
}
export type Analysis=ReturnType<typeof analyze>;
