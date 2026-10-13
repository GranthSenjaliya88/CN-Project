import axios from 'axios';
import type { SimConfig, SimResult, Scenario } from '../types/simulation';
const EVENT_TYPES=new Set(['data_sent','data_arrived','payload_delivered','ack_scheduled','ack_sent','ack_arrived','ack_accepted','ack_ignored','timeout','duplicate_discarded','transfer_complete']);
export function assertResult(value:unknown): asserts value is SimResult {
 const fail=()=>{throw new Error('The backend returned an invalid simulation response. Please retry.');};
 if(!value||typeof value!=='object')return fail();
 const r=value as SimResult;
 const nonnegative=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
 if(r.success!==true||!r.config||!r.metrics||!Array.isArray(r.events)||!Array.isArray(r.animation_hints)||!Array.isArray(r.delivered_messages)||!Array.isArray(r.assumptions)||!r.assumptions.every(a=>typeof a==='string')||typeof r.model_version!=='string')return fail();
 if(Object.values(r.config).length!==5||!Object.values(r.config).every(nonnegative))return fail();
 for(const key of ['unique_messages_requested','unique_messages_delivered','total_data_transmissions','retransmissions','duplicate_data_arrivals','acks_sent','acks_accepted','acks_ignored','transfer_complete_time_ms','all_events_finish_ms'] as const){if(!nonnegative(r.metrics[key]))return fail();}
 if(!r.events.length||r.events.some((e,i)=>!e||!nonnegative(e.time_ms)||!EVENT_TYPES.has(e.event_type)||typeof e.description!=='string'||!['SENDER','RECEIVER','CHANNEL'].includes(e.actor)||(i>0&&e.time_ms<r.events[i-1].time_ms)))return fail();
 if(r.animation_hints.some(h=>!h||!nonnegative(h.time_ms)||typeof h.anim_type!=='string'||(h.anim_type==='packet_launch'&&(!['data','ack'].includes(h.direction??'')||!nonnegative(h.arrive_at)||h.arrive_at!<h.time_ms||!nonnegative(h.msg_id)||![0,1].includes(h.seq!)))))return fail();
 if(r.delivered_messages.some(d=>!d||!nonnegative(d.time_ms)||!nonnegative(d.message_id)||![0,1].includes(d.seq)))return fail();
}
export async function runSimulation(config:SimConfig,signal?:AbortSignal):Promise<SimResult> {
 const {data}=await axios.post('/api/simulate',config,{signal,timeout:30000});
 if(data?.success===false) throw new Error(data.error||'Simulation failed.');
 assertResult(data);return data;
}
export function apiErrorMessage(error:unknown):string {
 if(axios.isAxiosError(error)) return error.response?.data?.error || 'Cannot reach the Python backend. Start it on port 5000 and retry.';
 return error instanceof Error?error.message:'Simulation failed. Please retry.';
}
export async function fetchScenarios():Promise<Scenario[]> {const {data}=await axios.get('/api/scenarios');return data.scenarios;}
export async function healthCheck():Promise<boolean> {try {await axios.get('/api/health',{timeout:3000});return true;}catch{return false;}}
