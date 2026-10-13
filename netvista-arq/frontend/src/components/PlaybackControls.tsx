// src/components/PlaybackControls.tsx
import type { PlaybackStatus } from '../types/simulation';

interface Props {
  status: PlaybackStatus;
  currentTimeMs: number;
  totalTimeMs: number;
  speed: number;
  onPauseResume: () => void;
  onNextEvent: () => void;
  onReplay: () => void;
  onReset: () => void;
  onSpeedChange: (s: number) => void;
  onSeek: (time:number) => void;
}

const SPEEDS = [0.25, 0.5, 1, 2, 4, 10, 100, 1000];

export function PlaybackControls({
  status, currentTimeMs, totalTimeMs, speed,
  onPauseResume, onNextEvent, onReplay, onReset, onSpeedChange, onSeek,
}: Props) {


  return (
    <div className="glass" style={{ padding: '12px 18px', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onPauseResume}
            disabled={status === 'idle' || status === 'complete'}
            id="btn-pause-resume"
            aria-label={status === 'playing' ? 'Pause' : 'Resume'}
          >
            {status === 'playing' ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onNextEvent}
            disabled={status === 'idle' || status === 'complete'}
            id="btn-next-event"
          >
            ⏭ Next Event
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onReplay}
            disabled={status === 'idle'}
            id="btn-replay"
          >
            🔄 Replay
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onReset}
            id="btn-reset-pb"
          >
            ↺ Reset
          </button>
        </div>

        {/* Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Speed:</span>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              style={{
                padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 600, border: 'none',
                background: speed === s ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.04)',
                color: speed === s ? '#22d3ee' : '#94a3b8',
                transition: 'all 0.15s',
              }}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Time display */}
        <div style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono', fontSize: '0.85rem', color: '#22d3ee' }}>
          {currentTimeMs.toFixed(0)} ms
          {totalTimeMs > 0 && <span style={{ color: '#8497ae' }}> / {totalTimeMs.toFixed(0)} ms</span>}
        </div>

        {/* Status chip */}
        {status !== 'idle' && (
          <span style={{
            padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
            background: status === 'playing' ? 'rgba(34,211,238,0.15)'
              : status === 'paused' ? 'rgba(251,146,60,0.15)'
              : 'rgba(74,222,128,0.15)',
            color: status === 'playing' ? '#22d3ee'
              : status === 'paused' ? '#fb923c'
              : '#4ade80',
          }}>
            {status.toUpperCase()}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {status !== 'idle' && (
        <div style={{ marginTop: 10 }}>
          <label htmlFor="timeline" className="muted">Seek through the calculated timeline</label>
          <input id="timeline" aria-label="Simulation timeline" type="range" min={0} max={totalTimeMs} step="any" value={currentTimeMs} onChange={e=>onSeek(Number(e.target.value))} style={{width:'100%',accentColor:'#22d3ee'}} />
        </div>
      )}
    </div>
  );
}
