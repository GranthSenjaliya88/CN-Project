import type { SimResult } from '../types/simulation';
export function packetJourneys(result:SimResult) {
 const arrivals=result.events.filter(e=>e.event_type==='data_arrived'||e.event_type==='ack_arrived');
 const used=new Set<number>();
 return result.events.filter(e=>e.event_type==='data_sent'||e.event_type==='ack_sent').map((e,index)=>{
  const data=e.event_type==='data_sent';
  const i=arrivals.findIndex((a,i)=>!used.has(i)&&a.event_type===(data?'data_arrived':'ack_arrived')&&a.message_id===e.message_id&&a.sequence===e.sequence&&a.time_ms===e.arrive_at&&(!data||a.attempt===e.attempt));
  if(i>=0)used.add(i);
  const arrival=arrivals[i];
  return {id:index+1,kind:data?'DATA':'ACK',message:e.message_id,sequence:e.sequence,attempt:e.attempt,
   sender:data?'Sender':'Receiver',receiver:data?'Receiver':'Sender',sent:e.time_ms,received:e.arrive_at??e.time_ms,
   retry:e.is_retransmission,duplicateAck:!!e.for_duplicate,
   outcome:!arrival?'Unknown':data?(arrival.duplicate?'Duplicate discarded':'Payload delivered'):(arrival.accepted?'ACK accepted':'ACK ignored')};
 });
}
export type PacketJourney=ReturnType<typeof packetJourneys>[number];
export function packetStatus(p:PacketJourney,time:number){return time<p.sent?'Scheduled':time<p.received?'In transit':p.outcome;}
