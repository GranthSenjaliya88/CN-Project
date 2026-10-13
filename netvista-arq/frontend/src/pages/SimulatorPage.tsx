import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { runSimulation, apiErrorMessage } from '../services/api';
import { DEFAULT_CONFIG, SCENARIOS, validateConfig, sameConfig } from '../services/config';
import { eventCSV, download } from '../services/exports';
import { makeRun, readRuns, writeRuns } from '../services/runs';
import { deriveState, makeInitialSenderState, makeInitialReceiverState, makeInitialMetrics } from '../simulation/playback';
import { SceneViewport } from '../components/SceneViewport';
import { SimulationControls } from '../components/SimulationControls';
import { SenderStateCard, ReceiverStateCard } from '../components/StateCards';
import { PlaybackControls } from '../components/PlaybackControls';
import { MetricsPanel } from '../components/MetricsPanel';
import { EventLog } from '../components/EventLog';
import { SequenceDiagram } from '../components/SequenceDiagram';
import { PacketLedger } from '../components/PacketLedger';
import { DeliveredTray } from '../components/DeliveredTray';
import type { SimConfig, SimResult, PlaybackStatus } from '../types/simulation';

export default function SimulatorPage() {
 const [config,setConfig]=useState<SimConfig>(()=>SCENARIOS[sessionStorage.getItem('arq_scenario')||'']||DEFAULT_CONFIG);
 const [errors,setErrors]=useState<Partial<Record<keyof SimConfig,string>>>({});
 const [result,setResult]=useState<SimResult|null>(null);
 const [loading,setLoading]=useState(false);
 const [apiError,setApiError]=useState<string|null>(null);
 const [notice,setNotice]=useState('');
 const [status,setStatus]=useState<PlaybackStatus>('idle');
 const [currentTimeMs,setCurrentTimeMs]=useState(0);
 const [speed,setSpeed]=useState(1);
 const [reducedMotion,setReducedMotion]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const requestRef=useRef<AbortController|null>(null);
 const generation=useRef(0);
 const busy=useRef(false);
 const timeRef=useRef(0);
 const totalTimeMs=result?.metrics.all_events_finish_ms??0;
 const stale=!!result&&!sameConfig(config,result.config);
 const derived=useMemo(()=>result?deriveState(result,currentTimeMs):{
  sender:makeInitialSenderState(config),receiver:makeInitialReceiverState(),metrics:makeInitialMetrics(),inFlight:[],appliedEvents:[]
 },[result,currentTimeMs,config]);
 const {sender:senderState,receiver:receiverState,metrics:liveMetrics,inFlight}=derived;
 const isTimeout=!!result&&result.events.some(e=>e.event_type==='timeout'&&e.time_ms<=currentTimeMs&&currentTimeMs-e.time_ms<150);
 const cancelPending=useCallback(()=>{generation.current++;requestRef.current?.abort();},[]);
 useEffect(()=>{sessionStorage.removeItem('arq_scenario');return cancelPending;},[cancelPending]);
 useEffect(()=>{
  if(status!=='playing')return;
  let frame=0,last=performance.now();
  const tick=(now:number)=>{
   const elapsed=document.hidden?0:(now-last)*speed;
   last=now;
   timeRef.current=Math.min(totalTimeMs,timeRef.current+elapsed);
   setCurrentTimeMs(timeRef.current);
   if(timeRef.current>=totalTimeMs){setStatus('complete');return;}
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(frame);
 },[status,speed,totalTimeMs]);
 const seek=useCallback((time:number)=>{
  timeRef.current=Math.min(totalTimeMs,Math.max(0,time));setCurrentTimeMs(timeRef.current);
  setStatus(timeRef.current>=totalTimeMs?'complete':'paused');
 },[totalTimeMs]);
 const handleConfigChange=(key:keyof SimConfig,value:number)=>{
  setConfig(p=>({...p,[key]:value}));setErrors(p=>({...p,[key]:undefined}));
 };
 const handleRun=async()=>{
  if(busy.current)return;
  const errs=validateConfig(config);setErrors(errs);if(Object.keys(errs).length)return;
  requestRef.current?.abort();const controller=new AbortController();requestRef.current=controller;
  const id=++generation.current;busy.current=true;setLoading(true);setApiError(null);setNotice('');
  setResult(null);setStatus('idle');timeRef.current=0;setCurrentTimeMs(0);
  try {
   const res=await runSimulation({...config},controller.signal);
   if(id!==generation.current)return;
   setResult(res);setStatus(reducedMotion?'paused':'playing');
  }catch(error){if(id===generation.current&&!controller.signal.aborted)setApiError(apiErrorMessage(error));}
  finally{if(id===generation.current){busy.current=false;setLoading(false);}}
 };
 const handleReset=()=>{
  generation.current++;requestRef.current?.abort();busy.current=false;
  setLoading(false);setResult(null);setStatus('idle');timeRef.current=0;setCurrentTimeMs(0);setApiError(null);setErrors({});setNotice('');
 };
 const handlePauseResume=()=>setStatus(p=>p==='playing'?'paused':p==='paused'?'playing':p);
 const handleNextEvent=()=>{if(result)seek(result.events.find(e=>e.time_ms>timeRef.current)?.time_ms??totalTimeMs);};
 const handleReplay=()=>{if(!result)return;timeRef.current=0;setCurrentTimeMs(0);setStatus(reducedMotion?'paused':'playing');};
 const handleScenario=(id:string)=>{if(SCENARIOS[id]){setConfig({...SCENARIOS[id]});setErrors({});}};
 const handleSpeedChange=(value:number)=>setSpeed(value);
 const exportCSV=()=>{if(result)download('arq_events.csv',eventCSV(result),'text/csv;charset=utf-8');};
 const saveRun=()=>{
  if(!result)return;
  try{const name=Object.keys(SCENARIOS).find(id=>sameConfig(SCENARIOS[id],result.config));
   writeRuns([...readRuns(),makeRun(result,name?`${name} run`:`Custom: ACK ${result.config.ack_delay_ms} / timeout ${result.config.timeout_ms} ms`)]);
   setNotice('Saved. Open Experiments to compare this run.');
  }catch{setNotice('Browser storage is unavailable. Download the run JSON instead.');}
 };
  return (
    <main style={{ paddingTop: 64 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 4 }}>
            Interactive ARQ <span className="gradient-text">Simulator</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Configure settings → click Calculate &amp; Animate → watch the 3D protocol unfold.
          </p>
        </div>

        <div className="lab-status"><span>PYTHON EVENT ENGINE</span><span>3D + TIMELINE</span><span>DETERMINISTIC RESULTS</span></div>
        <div className="lab-toolbar">
          <label><input type="checkbox" checked={reducedMotion} onChange={e=>{setReducedMotion(e.target.checked);if(e.target.checked&&status==='playing')setStatus('paused');}} /> Reduced motion / start paused</label>
          {result&&<><button className="btn btn-secondary btn-sm" onClick={saveRun}>Save for comparison</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>download('arq_run.json',JSON.stringify(result,null,2),'application/json')}>Download run JSON</button>
          <button className="btn btn-secondary btn-sm" onClick={()=>window.print()}>Print results</button></>}
        </div>
        {notice&&<p role="status">{notice}</p>}
        {/* API error */}
        {apiError && (
          <div role="alert" style={{
            marginBottom: 16, padding: '12px 16px',
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 10, color: '#f87171', fontSize: '0.85rem',
          }}>
            ⚠️ {apiError}
          </div>
        )}

        {/* Layout: config | main */}
        <div className="simulator-layout">

          {/* Config panel */}
          <SimulationControls
            config={config}
            errors={errors}
            loading={loading}
            isRunning={status === 'playing'}
            stale={stale}
            onConfigChange={handleConfigChange}
            onRun={handleRun}
            onReset={handleReset}
            onScenario={handleScenario}
          />

          {/* Main area */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* 3D Scene */}
            <div className="glass" style={{ height: 440, overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', top: 12, left: 16, zIndex: 10,
                fontSize: '0.75rem', color: '#94a3b8',
                background: 'rgba(7,13,26,0.8)', padding: '4px 10px', borderRadius: 6,
              }}>
                {result ? `${status === 'complete' ? 'Playback finished' : senderState.state === 'Complete' ? 'Transfer complete · pending channel events' : status === 'paused' ? 'Paused' : 'Simulation playing'} — ${currentTimeMs.toFixed(1)} ms` : 'Configure and run the simulation'}
              </div>
              <SceneViewport
                sender={senderState}
                receiver={receiverState}
                inFlight={inFlight}
                currentTimeMs={currentTimeMs}
                isTimeout={isTimeout}
                reducedMotion={reducedMotion}
              />
            </div>

            {/* State cards row */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <SenderStateCard state={senderState} currentTimeMs={currentTimeMs} />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <ReceiverStateCard state={receiverState} currentTimeMs={currentTimeMs} />
              </div>
              <div style={{ flex: '2 1 300px' }}>
                <DeliveredTray
                  duplicateCount={liveMetrics.duplicates}
                  currentTimeMs={currentTimeMs}
                  allDelivered={result?.delivered_messages ?? []}
                />
              </div>
            </div>

            {/* Playback controls */}
            <PlaybackControls
              status={status}
              currentTimeMs={currentTimeMs}
              totalTimeMs={totalTimeMs}
              speed={speed}
              onPauseResume={handlePauseResume}
              onNextEvent={handleNextEvent}
              onReplay={handleReplay}
              onReset={handleReset}
              onSpeedChange={handleSpeedChange}
              onSeek={seek}
            />

            <PacketLedger result={result} time={currentTimeMs} />

            {/* Metrics */}
            <MetricsPanel live={liveMetrics} result={result} />

            {/* Event log */}
            <EventLog
              events={result?.events ?? []}
              currentTimeMs={currentTimeMs}
              onExportCSV={exportCSV}
            />

            {result&&<details className="glass model-notes"><summary>Run settings &amp; model assumptions</summary>
              <p>Messages: {result.config.num_frames} · Data travel: {result.config.data_travel_ms} ms · ACK delay: {result.config.ack_delay_ms} ms · ACK travel: {result.config.ack_travel_ms} ms · Timeout: {result.config.timeout_ms} ms</p>
              <ul>{result.assumptions.map(a=><li key={a}>{a}</li>)}</ul>
            </details>}
            {/* Sequence diagram */}
            {result && (
              <div style={{ marginTop: 12 }}>
                <SequenceDiagram events={result.events} currentTimeMs={currentTimeMs} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
