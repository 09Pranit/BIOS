import {createHash} from 'node:crypto';
import type {RawRecord,Fields} from '../../simulator/src/types.js';
import type {Event} from './types.js';
export function redact(s:string){return s.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[REDACTED_EMAIL]').replace(/\b\d{3}[- ]\d{2}[- ]\d{4}\b/g,'[REDACTED_ID]').replace(/\b(?:\+91[- ]?)?[6-9]\d{9}\b/g,'[REDACTED_PHONE]');}
export function parseFields(record:RawRecord):Fields{
 if(record.format==='json')return JSON.parse(record.raw_line);
 const result:Record<string,unknown>={};
 if(record.format==='pipe'){for(const item of record.raw_line.split('|')){const i=item.indexOf(':');result[item.slice(0,i)]=decodeURIComponent(item.slice(i+1));}}
 else for(const match of record.raw_line.matchAll(/(\w+)=("(?:[^"\\]|\\.)*"|[^\s]+)/g)){try{result[match[1]]=JSON.parse(match[2]);}catch{result[match[1]]=match[2];}}
 for(const k of ['seq','value','status'])if(result[k]!==undefined)result[k]=Number(result[k]);
 return result as unknown as Fields;
}
export function ingest(records:RawRecord[]):Event[]{return records.map(r=>{const parsed_ts=typeof r.raw_ts==='number'?r.raw_ts:Date.parse(r.raw_ts);if(!Number.isFinite(parsed_ts))throw new Error(`Invalid timestamp: ${r.event_id}`);const fields=parseFields(r);if(!['log','metric','change'].includes(fields.kind)||!Number.isInteger(fields.seq))throw new Error(`Invalid record: ${r.event_id}`);return {...r,raw_line:redact(r.raw_line),fields:{...fields,message:redact(fields.message)},content_hash:createHash('sha256').update(r.raw_line).digest('hex'),parsed_ts,corrected_ts:[parsed_ts,parsed_ts],kind:'OBSERVED'};});}
