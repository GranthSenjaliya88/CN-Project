// src/pages/ExperimentsPage.tsx
import { useState, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { runSimulation, apiErrorMessage } from '../services/api';
import { readRuns, writeRuns, makeRun } from '../services/runs';
import { comparisonCSV, download } from '../services/exports';
import { Link } from 'react-router-dom';
import type { SimConfig, SimResult, SavedRun } from '../types/simulation';

const PRESETS: Array<{ id: string; label: string; icon: string; desc: string; config: SimConfig }> = [
  {
    id: 'normal', label: 'Normal Delivery', icon: '🟢',
    desc: 'ACK delay 100 ms · Timeout 800 ms · ACK arrives at 300 ms — before timeout.',
    config: { num_frames: 1, data_travel_ms: 100, ack_delay_ms: 100, ack_travel_ms: 100, timeout_ms: 800 },
  },
  {
    id: 'delayed', label: 'Delayed ACK', icon: '🟠',
    desc: 'ACK delay 900 ms · Timeout 600 ms · ACK arrives at 1100 ms — AFTER timeout → retransmission.',
    config: { num_frames: 1, data_travel_ms: 100, ack_delay_ms: 900, ack_travel_ms: 100, timeout_ms: 600 },
  },
  {
    id: 'adjusted', label: 'Adjusted Timeout', icon: '🔵',
    desc: 'ACK delay 900 ms · Timeout 1400 ms · Same ACK delay, but longer timeout prevents retransmission.',
    config: { num_frames: 1, data_travel_ms: 100, ack_delay_ms: 900, ack_travel_ms: 100, timeout_ms: 1400 },
  },
];

export default function ExperimentsPage() {
  const [runs, setRuns] = useState<SavedRun[]>(readRuns);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request=useRef<AbortController|null>(null);
  const generation=useRef(0);
  const busy=useRef(false);
  useEffect(()=>()=>{generation.current++;request.current?.abort();},[]);
  useEffect(()=>{try{writeRuns(runs);}catch{/* Runs remain usable in memory when storage is unavailable. */}},[runs]);
  const runPreset = async (preset: typeof PRESETS[0]) => {
    if(busy.current)return;
    busy.current=true;
    const id=++generation.current;
    request.current?.abort();const controller=new AbortController();request.current=controller;
    setLoading(preset.id);
    setError(null);
    try {
      const res: SimResult = await runSimulation(preset.config, controller.signal);
      if (!res.success) throw new Error(res.error);

      if(id!==generation.current)return;
      const run=makeRun(res,preset.label);
      setRuns(prev => {
        // Replace existing run with same preset id
        const filtered = prev.filter(r => r.label !== preset.label);
        return [...filtered, run];
      });
    } catch (err: unknown) {
      if(id===generation.current&&!controller.signal.aborted)setError(apiErrorMessage(err));
    } finally {
      if(id===generation.current){busy.current=false;setLoading(null);}
    }
  };

  const clearRuns = () => {generation.current++;request.current?.abort();busy.current=false;setLoading(null);setRuns([]);};

  const exportComparison=()=>{if(runs.length)download('arq_comparison.csv',comparisonCSV(runs),'text/csv;charset=utf-8');};
  const chartData=runs.map(run=>({name:run.label,retransmissions:run.metrics.retransmissions,duplicates:run.metrics.duplicate_data_arrivals,completion:run.metrics.transfer_complete_time_ms}));

  return (
    <main style={{ paddingTop: 80 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            Experiments & <span className="gradient-text">Comparison</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>
            Run the reference scenarios, or save a custom run in the Simulator. Only calculated runs appear in charts.
          </p>
        </div>

        <div className="lab-toolbar"><Link className="btn btn-secondary" to="/simulator">Create a custom experiment</Link><span className="muted">Saved runs stay in this browser (up to 30).</span></div>
        {/* Preset buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          {PRESETS.map(p => {
            const run = runs.find(r => r.label === p.label);
            return (
              <div key={p.id} className="glass" style={{ padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: 6 }}>{p.label}</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 16, lineHeight: 1.6 }}>{p.desc}</p>

                {run && (
                  <div style={{
                    padding: '10px 12px', background: 'rgba(34,211,238,0.05)',
                    border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8,
                    marginBottom: 12, fontSize: '0.78rem',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      <span style={{ color: '#94a3b8' }}>Transmissions:</span>
                      <strong>{run.metrics.total_data_transmissions}</strong>
                      <span style={{ color: '#94a3b8' }}>Retransmissions:</span>
                      <strong style={{ color: run.metrics.retransmissions > 0 ? '#fb923c' : '#4ade80' }}>
                        {run.metrics.retransmissions}
                      </strong>
                      <span style={{ color: '#94a3b8' }}>Duplicates:</span>
                      <strong style={{ color: run.metrics.duplicate_data_arrivals > 0 ? '#fb923c' : '#4ade80' }}>
                        {run.metrics.duplicate_data_arrivals}
                      </strong>
                      <span style={{ color: '#94a3b8' }}>Completion:</span>
                      <strong style={{ color: '#22d3ee' }}>
                        {run.metrics.transfer_complete_time_ms ?? '—'} ms
                      </strong>
                    </div>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => runPreset(p)}
                  disabled={loading !== null}
                >
                  {loading === p.id ? '⏳ Running…' : `▶ Run ${p.label}`}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div role="alert" style={{ marginBottom: 20, padding: 14, background: 'rgba(248,113,113,0.1)',
            border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, color: '#f87171' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Charts */}
        {runs.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 20, marginBottom: 24 }}>
              <div className="glass" style={{ padding: 24 }}>
                <div className="panel-heading">📊 Retransmissions &amp; Duplicates</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#0d1a2e', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8 }}
                      labelStyle={{ color: '#f0f9ff' }} />
                    <Legend />
                    <Bar dataKey="retransmissions" fill="#fb923c" radius={[4, 4, 0, 0]} name="Retransmissions" />
                    <Bar dataKey="duplicates" fill="#f87171" radius={[4, 4, 0, 0]} name="Duplicates" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass" style={{ padding: 24 }}>
                <div className="panel-heading">⏱ Transfer Completion Time</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} unit="ms" />
                    <Tooltip contentStyle={{ background: '#0d1a2e', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 8 }}
                      labelStyle={{ color: '#f0f9ff' }} />
                    <Bar dataKey="completion" fill="#22d3ee" radius={[4, 4, 0, 0]} name="Completion (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparison table */}
            <div className="glass" style={{ padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap:12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="panel-heading" style={{ margin: 0 }}>📋 Results Comparison Table</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={exportComparison}>⬇ CSV</button>
                  <button className="btn btn-secondary btn-sm" onClick={clearRuns}>🗑 Clear</button>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(56,189,248,0.15)' }}>
                      {['Scenario', 'Frames / Travel', 'ACK Delay', 'Timeout', 'Transmissions', 'Retransmissions', 'Duplicates', 'Delivered', 'Completion'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map(run => (
                      <tr key={run.id} style={{ borderBottom: '1px solid rgba(56,189,248,0.06)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{run.label}</td>
                        <td style={{padding:12}}>{run.config.num_frames} frames / data {run.config.data_travel_ms} ms / ACK {run.config.ack_travel_ms} ms</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{run.config.ack_delay_ms} ms</td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>{run.config.timeout_ms} ms</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{run.metrics.total_data_transmissions}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: run.metrics.retransmissions > 0 ? '#fb923c' : '#4ade80' }}>
                          {run.metrics.retransmissions}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: run.metrics.duplicate_data_arrivals > 0 ? '#f87171' : '#4ade80' }}>
                          {run.metrics.duplicate_data_arrivals}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4ade80' }}>{run.metrics.unique_messages_delivered}</td>
                        <td style={{ padding: '10px 12px', color: '#22d3ee', fontFamily: 'monospace' }}>
                          {run.metrics.transfer_complete_time_ms ?? '—'} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Key insight */}
            <div className="glass" style={{ padding: 24 }}>
              <div className="panel-heading">💡 Key Insight</div>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.9rem' }}>
                For the reference cases, comparing <strong style={{ color: '#fb923c' }}>Delayed ACK</strong> with{' '}
                <strong style={{ color: '#60a5fa' }}>Adjusted Timeout</strong> shows the core lesson:
                increasing the timeout prevents the unnecessary retransmission because the ACK still arrives before
                the longer timeout expires. However, increasing the timeout is not a universal fix — when a frame or ACK is
                <em> actually lost</em>, a longer timeout delays recovery. The correct approach is to tune the
                timeout to match realistic round-trip time estimates.
              </p>
            </div>
          </>
        )}

        {runs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#8497ae' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧪</div>
            <p>Run at least one scenario above to see the comparison.</p>
          </div>
        )}
      </div>
    </main>
  );
}
