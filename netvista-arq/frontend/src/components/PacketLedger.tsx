import {useMemo,useState} from 'react';
import type {SimResult} from '../types/simulation';
import {packetJourneys,packetStatus} from '../simulation/packets';
import {download,csvCell} from '../services/exports';
export function PacketLedger({result,time}:{result:SimResult|null;time:number}) {
 const rows=useMemo(()=>result?packetJourneys(result):[],[result]);
 const [filter,setFilter]=useState('ALL');
 const visible=rows.filter(p=>filter==='ALL'||p.kind===filter);
 const fmt=(n:number)=>n.toLocaleString(undefined,{maximumFractionDigits:3});
 const exportRows=()=>download('arq_packet_journeys.csv',[
  ['Packet','Type','Message','Sequence','Attempt','Sender','Receiver','Sent ms','Arrival ms (calculated)','Travel ms','Status at playback','Playback ms'],
  ...visible.map(p=>[p.id,p.kind,p.message,p.sequence,p.attempt??'',p.sender,p.receiver,p.sent,p.received,p.received-p.sent,packetStatus(p,time),time])
 ].map(row=>row.map(csvCell).join(',')).join('\r\n'),'text/csv;charset=utf-8');
 return <section className="glass packet-ledger" aria-label="Packet transmission details">
  <div className="ledger-heading"><div><div className="eyebrow">PACKET INSPECTOR</div><h2>Every send. Every arrival.</h2></div>
  <label>Show <select aria-label="Filter packet type" value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">All packets</option><option>DATA</option><option>ACK</option></select></label>
  <button className="btn btn-secondary btn-sm" disabled={!result} onClick={exportRows}>Export packet CSV</button></div>
  <p className="muted">All times are simulation milliseconds. Future timestamps are calculated; receipt is confirmed only when playback reaches the arrival. ACK delay is receiver waiting time, separate from packet travel.</p>
  {!result?<p>Calculate a run to inspect packets and acknowledgments.</p>:<>
  <div className="packet-summary"><span>Sent: <b>{rows.filter(p=>p.sent<=time).length}</b></span><span>Received: <b>{rows.filter(p=>p.received<=time).length}</b></span><span>In transit: <b>{rows.filter(p=>p.sent<=time&&p.received>time).length}</b></span><span>Receiver ACK delay: <b>{fmt(result.config.ack_delay_ms)} ms</b></span></div>
  <div className="ledger-scroll" tabIndex={0} role="region" aria-label="Scrollable packet table"><table><thead><tr>{['Packet / message','Seq / attempt','Sender','Receiver','Sent at (ms)','Arrival at (ms)','Travel / elapsed (ms)','Status'].map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead>
  <tbody>{visible.map(p=><tr key={p.id} className={packetStatus(p,time)==='In transit'?'packet-active':''}><td><strong>{p.kind} #{p.id} · M{p.message}</strong><small>{p.retry?'Retransmission':p.duplicateAck?'ACK for duplicate':''}</small></td><td>{p.sequence} / {p.attempt??'—'}</td><td>{p.sender}</td><td>{p.receiver}</td><td>{time<p.sent?'Scheduled: ':''}{fmt(p.sent)}</td><td>{time<p.received?'Expected: ':''}{fmt(p.received)}</td><td>{fmt(p.received-p.sent)} / {fmt(Math.max(0,Math.min(time,p.received)-p.sent))}</td><td>{packetStatus(p,time)}</td></tr>)}</tbody></table></div></>}
 </section>;
}
