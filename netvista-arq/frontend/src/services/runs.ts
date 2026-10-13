import type { SavedRun, SimResult } from '../types/simulation';
const KEY='netvista-comparisons-v1';
export function readRuns():SavedRun[] {
 try { const data=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(data)?data.filter(r=>r?.config&&r?.metrics&&typeof r.label==='string').slice(-30):[]; } catch {return [];}
}
export function writeRuns(runs:SavedRun[]) { localStorage.setItem(KEY,JSON.stringify(runs.slice(-30))); }
export function makeRun(result:SimResult,label:string):SavedRun {
 return {id:crypto.randomUUID(),label,config:{...result.config},metrics:{...result.metrics},timestamp:new Date().getTime()};
}
