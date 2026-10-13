import { Component, useState } from 'react';
import type { ReactNode } from 'react';
import { NetworkScene } from './NetworkScene';
import type { NetworkSceneProps } from './NetworkScene';

export class SceneBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?this.props.fallback:this.props.children;}
}
export function FlatScene({sender,receiver,inFlight,currentTimeMs}:NetworkSceneProps) {
 const remaining=sender.timerStartMs===null?null:Math.max(0,sender.timeoutMs-(currentTimeMs-sender.timerStartMs));
 return <div className="flat-scene"><svg viewBox="0 0 900 360" role="img" aria-label="2D sender receiver simulation">
 <defs><pattern id="lab-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#183247" strokeWidth=".5"/></pattern><marker id="data-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#60a5fa"/></marker><marker id="ack-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="#4ade80"/></marker></defs>
 <rect width="900" height="360" fill="url(#lab-grid)"/>
 <rect x="190" y="105" width="520" height="50" rx="25" fill="#163959"/>
 <rect x="190" y="225" width="520" height="50" rx="25" fill="#103b36"/>
 <path d="M200 130H700" stroke="#60a5fa" strokeWidth="2" markerEnd="url(#data-arrow)"/>
 <path d="M700 250H200" stroke="#4ade80" strokeWidth="2" markerEnd="url(#ack-arrow)"/>
 <text x="450" y="80" fill="#60a5fa" textAnchor="middle">DATA · Sender → Receiver</text>
 <text x="450" y="315" fill="#4ade80" textAnchor="middle">ACK · Receiver → Sender</text>
 {[{x:10,label:'SENDER',color:'#22d3ee',state:sender.state,detail:`Message ${sender.currentMessage??'—'} · Seq ${sender.sequence??'—'}`,sub:remaining===null?'Timer idle':`Timeout in ${remaining.toFixed(0)} ms`},{x:715,label:'RECEIVER',color:'#4ade80',state:receiver.state,detail:`Expected seq ${receiver.expectedSeq}`,sub:`${receiver.pendingAcks} ACK pending`}].map(n=><g key={n.label}><rect x={n.x} y="95" width="175" height="180" rx="16" fill="#102339" stroke={n.color}/><rect x={n.x+14} y="111" width="147" height="90" rx="8" fill="#071322" stroke="#294158"/><text x={n.x+87} y="135" fill={n.color} textAnchor="middle" fontSize="16">{n.label}</text><text x={n.x+87} y="162" fontSize="11" fill="#e2e8f0" textAnchor="middle">{n.state}</text><text x={n.x+87} y="184" fontSize="11" fill="#94a3b8" textAnchor="middle">{n.detail}</text><text x={n.x+87} y="233" fontSize="11" fill={n.color} textAnchor="middle">{n.sub}</text></g>)}
 {inFlight.map((p,i)=>{const f=Math.max(0,Math.min(1,(currentTimeMs-p.launchTimeMs)/Math.max(.001,p.arriveTimeMs-p.launchTimeMs)));const x=p.direction==='data'?205+f*490:695-f*490;const y=(p.direction==='data'?130:250)+(i%3-1)*8;const color=p.direction==='ack'?'#4ade80':p.isRetransmission?'#fb923c':'#60a5fa';return <g key={p.id}><title>{`${p.label}, message ${p.msgId}, sent ${p.launchTimeMs} ms, arrival ${p.arriveTimeMs} ms`}</title><rect x={x-18} y={y-10} width="36" height="20" rx="5" fill={color}/><text x={x} y={y+4} textAnchor="middle" fill="#071322" fontSize="11">{p.seq}</text><text x={x} y={y-25} textAnchor="middle" fill={color} fontSize="11">{p.label} · M{p.msgId}</text><text x={x} y={y+31} textAnchor="middle" fill="#cbd5e1" fontSize="10">{Math.max(0,p.arriveTimeMs-currentTimeMs).toFixed(0)} ms left</text></g>;})}
 </svg></div>;
}
export function SceneViewport(props:NetworkSceneProps) {
 const [flat,setFlat]=useState(false),[cameraReset,setCameraReset]=useState(0);
 return <><div className="scene-tools"><button className="btn btn-secondary btn-sm" onClick={()=>setFlat(v=>!v)}>{flat?'Show 3D':'Show 2D'}</button><button className="btn btn-secondary btn-sm" disabled={flat} onClick={()=>setCameraReset(v=>v+1)}>Reset Camera</button></div>
 {flat?<FlatScene {...props}/>:<SceneBoundary fallback={<><p role="status" className="scene-fallback">3D unavailable. The same simulation is available below in 2D.</p><FlatScene {...props}/></>}><NetworkScene {...props} cameraReset={cameraReset}/></SceneBoundary>}
 <div className="scene-legend"><span style={{color:'#60a5fa'}}>● DATA →</span><span style={{color:'#4ade80'}}>● ← ACK</span><span style={{color:'#fb923c'}}>● Retransmission</span><span>Packet details below ↓</span></div></>;
}
