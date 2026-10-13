import { useMemo } from 'react';
import type { SimEvent } from '../types/simulation';
export function SequenceDiagram({events,currentTimeMs}:{events:SimEvent[];currentTimeMs:number}) {
 const timeline=useMemo(()=>{
  const times=[...new Set(events.map(e=>e.time_ms))];
  const y=new Map(times.map((t,i)=>[t,65+i*34]));
  const arrivals=events.filter(e=>e.event_type==='ack_arrived');
  const arrows=events.filter(e=>e.event_type==='data_sent'||e.event_type==='ack_sent').map(e=>({event:e,end:e.arrive_at??e.time_ms,ignored:e.event_type==='ack_sent'&&arrivals.some(a=>a.time_ms===e.arrive_at&&a.message_id===e.message_id&&a.sequence===e.sequence&&!a.accepted)}));
  return {times,y,arrows,height:110+times.length*34};
 },[events]);
 return <div className="glass sequence-panel"><div className="panel-heading">Sequence diagram</div><p className="muted">Event rows are evenly spaced for readability; labels show actual milliseconds.</p>
 <div style={{maxHeight:600,overflow:'auto'}}><svg width="100%" viewBox={`0 0 620 ${timeline.height}`} style={{minWidth:480}} role="img" aria-label="Sender receiver event sequence diagram">
 <text x="130" y="30" textAnchor="middle" fill="#22d3ee">SENDER</text><text x="490" y="30" textAnchor="middle" fill="#4ade80">RECEIVER</text>
 {[130,490].map(x=><line key={x} x1={x} x2={x} y1="45" y2={timeline.height} stroke="#334e68" strokeDasharray="5 5"/>)}
 {timeline.times.map(t=><text key={t} x="8" y={(timeline.y.get(t)??0)+4} fontSize="11" fill={t<=currentTimeMs?'#94a3b8':'#475569'}>{t.toFixed(1)} ms</text>)}
 {timeline.arrows.filter(a=>a.event.time_ms<=currentTimeMs).map((a,i)=>{
 const e=a.event,data=e.event_type==='data_sent',x1=data?130:490,x2=data?490:130,y1=timeline.y.get(e.time_ms)!,y2=timeline.y.get(a.end)??y1;
 const progress=a.end===e.time_ms?1:Math.min(1,(currentTimeMs-e.time_ms)/(a.end-e.time_ms));const x=x1+(x2-x1)*progress,y=y1+(y2-y1)*progress;
 const color=data?(e.is_retransmission?'#fb923c':'#60a5fa'):(a.ignored?'#94a3b8':'#4ade80');
 return <g key={i}><line x1={x1} x2={x} y1={y1} y2={y} stroke={color} strokeWidth="2" strokeDasharray={a.ignored?'4 4':undefined}/><circle cx={x} cy={y} r="3" fill={color}/><text x="310" y={(y1+y2)/2-5} textAnchor="middle" fill={color} fontSize="10">{data?'DATA':'ACK'} {e.sequence} · msg {e.message_id}{e.is_retransmission?' · retry':''}{a.ignored?' · ignored':''}</text></g>;
 })}
 {events.filter(e=>e.event_type==='timeout'&&e.time_ms<=currentTimeMs).map((e,i)=><g key={i}><circle cx="130" cy={timeline.y.get(e.time_ms)} r="5" fill="#f87171"/><text x="140" y={(timeline.y.get(e.time_ms)??0)+16} fill="#f87171" fontSize="10">TIMEOUT</text></g>)}
 </svg></div></div>;
}
