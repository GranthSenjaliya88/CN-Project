import type { SimConfig } from '../types/simulation';
export const DEFAULT_CONFIG: SimConfig = {num_frames:4,data_travel_ms:100,ack_delay_ms:100,ack_travel_ms:100,timeout_ms:800};
export const SCENARIOS: Record<string,SimConfig> = {
 normal:{...DEFAULT_CONFIG,num_frames:1},
 delayed:{...DEFAULT_CONFIG,num_frames:1,ack_delay_ms:900,timeout_ms:600},
 adjusted:{...DEFAULT_CONFIG,num_frames:1,ack_delay_ms:900,timeout_ms:1400},
};
export function validateConfig(config:SimConfig) {
 const errors:Partial<Record<keyof SimConfig,string>>={};
 if (!Number.isInteger(config.num_frames)||config.num_frames<1||config.num_frames>20) errors.num_frames='Enter an integer from 1 to 20.';
 for (const key of ['data_travel_ms','ack_delay_ms','ack_travel_ms','timeout_ms'] as const) {
  const value=config[key], max=3_600_000;
  if (!Number.isFinite(value)||(key==='ack_delay_ms'?value<0:value<=0)||value>max)
   errors[key]=`Enter a finite number ${key==='ack_delay_ms'?'from 0':'greater than 0'} up to ${max} ms.`;
 }
 return errors;
}
export function sameConfig(a:SimConfig,b:SimConfig) {
 return (Object.keys(DEFAULT_CONFIG) as (keyof SimConfig)[]).every(k=>a[k]===b[k]);
}
