import type {Fields,RawRecord,Interval,Service,FaultClass} from '../../simulator/src/types.js';
export interface Event extends RawRecord { fields: Fields; content_hash: string; parsed_ts: number; corrected_ts: Interval; kind: 'OBSERVED'|'INFERRED'|'UNOBSERVED' }
export interface SkewWindow { time:number; offset:number; interval:Interval; pairs:number }
export interface SkewEstimate { service:Service; offset:number; interval:Interval; drift_ppm:number; windows:SkewWindow[]; reference:Service; warning?:string }
export interface Link { from:string; to:string; confidence:number; method:'trace'|'probabilistic'; reasoning:string }
export interface Gap { id:string; service:Service; interval:Interval; classification:'log loss'|'service down'|'never received'; evidence_ids:string[]; justification:string; missing_count:number }
export interface Hypothesis { id:string; component:Service|'unknown'; fault:FaultClass|'unknown'; statement:string; onset:Interval; propagation_path:Service[]; prior:number; likelihood:number; penalties:{unexplained:number;contradiction:number;temporal:number;topology:number}; support:string[]; contradictions:string[]; raw:number; calibrated:number; counterfactual?:Counterfactual }
export interface Counterfactual { verdict:'SUPPORTED'|'REFUTED'|'INCONCLUSIVE'; reproduction:number; reduction:number; ci:Interval; intervention:string; seeds:number[]; curves:{t:number;factual:number;reproduction:number;cured:number}[]; limitation:string }
export interface AgentStep { step:number; tool:string; input:Record<string,unknown>; output:string; evidence_ids:string[]; source:'ai'|'rules'; started_at:string; duration_ms:number; tokens?:number }
export interface Calibration { method:'temperature'; temperature:number; fitted_cases:number; fit_seeds:number[]; test_seeds:number[]; created_at:string }
