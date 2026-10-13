import {useEffect,useMemo,useState} from 'react';
import {SceneViewport} from './SceneViewport';
import {runSimulation} from '../services/api';
import {deriveState} from '../simulation/playback';
import type {SimResult} from '../types/simulation';
export function LiveHero(){
 const [result,setResult]=useState<SimResult|null>(null),[time,setTime]=useState(0),[error,setError]=useState('');
 const [play,setPlay]=useState(()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const c=new AbortController();runSimulation({num_frames:1,data_travel_ms:1000,ack_delay_ms:1800,ack_travel_ms:1000,timeout_ms:2600},c.signal).then(setResult).catch(()=>{if(!c.signal.aborted)setError('Start the Python backend to load the live demo.');});return()=>c.abort();},[]);
 useEffect(()=>{if(!result||!play)return;let id=0,last=performance.now();const tick=(now:number)=>{const dt=document.hidden?0:Math.max(0,Math.min(100,now-last));last=now;setTime(t=>(t+dt)%((result.metrics.all_events_finish_ms??0)+1800));id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[result,play]);
 const state=useMemo(()=>result?deriveState(result,time):null,[result,time]);
 return <div className="home-live-stage"><div className="hero-live-status"><span>LIVE PYTHON TRACE · DELAYED ACK</span><button className="btn btn-secondary btn-sm" onClick={()=>setPlay(v=>!v)}>{play?'Pause preview':'Play preview'}</button></div>{state?<SceneViewport sender={state.sender} receiver={state.receiver} inFlight={state.inFlight} currentTimeMs={time}/>:<p style={{padding:60}}>{error||'Loading calculated demonstration…'}</p>}<div className="hero-live-metrics"><span>{time.toFixed(0)} ms</span><span>{state?.metrics.transmissions??0} transmissions</span><span>{state?.metrics.duplicates??0} duplicates</span><span>{state?.metrics.delivered??0} delivered once</span></div></div>;
}
