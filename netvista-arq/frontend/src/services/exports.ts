import type { SimResult, SavedRun } from '../types/simulation';
export function csvCell(value:unknown):string { return '"'+String(value??'').replaceAll('"','""')+'"'; }
export function eventCSV(result:SimResult):string {
 const c=result.config;
 const headers=['time_ms','actor','event_type','message_id','sequence','attempt','description','num_frames','data_travel_ms','ack_delay_ms','ack_travel_ms','timeout_ms','model_version'];
 return [headers,...result.events.map(e=>[e.time_ms,e.actor,e.event_type,e.message_id,e.sequence,e.attempt,e.description,c.num_frames,c.data_travel_ms,c.ack_delay_ms,c.ack_travel_ms,c.timeout_ms,result.model_version])].map(r=>r.map(csvCell).join(',')).join('\r\n');
}
export function comparisonCSV(runs:SavedRun[]):string {
 return [['Scenario','Frames','Data travel (ms)','ACK delay (ms)','ACK travel (ms)','Timeout (ms)','Transmissions','Retransmissions','Duplicates','Delivered','Completion (ms)'],...runs.map(r=>[r.label,r.config.num_frames,r.config.data_travel_ms,r.config.ack_delay_ms,r.config.ack_travel_ms,r.config.timeout_ms,r.metrics.total_data_transmissions,r.metrics.retransmissions,r.metrics.duplicate_data_arrivals,r.metrics.unique_messages_delivered,r.metrics.transfer_complete_time_ms])].map(r=>r.map(csvCell).join(',')).join('\r\n');
}
export function download(name:string,content:string,type='text/plain') {
 const url=URL.createObjectURL(new Blob([content],{type}));
 const a=document.createElement('a'); a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
