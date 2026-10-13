// src/components/SimulationControls.tsx
import { SCENARIOS, sameConfig } from '../services/config';
import type { SimConfig } from '../types/simulation';

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  unit?: string;
  highlight?: boolean;
  error?: string;
  onChange: (v: number) => void;
}

function Field({ id, label, hint, value, min, max, unit = 'ms', highlight, error, onChange }: FieldProps) {
  return (
    <div style={{
      marginBottom: 14,
      padding: highlight ? '10px 12px' : '0',
      background: highlight ? 'rgba(34,211,238,0.04)' : 'transparent',
      borderRadius: 8,
      border: highlight ? '1px solid rgba(34,211,238,0.15)' : 'none',
    }}>
      <label htmlFor={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
          {label}
          {highlight && <span style={{
            marginLeft: 6, fontSize: '0.65rem', padding: '1px 6px',
            background: 'rgba(34,211,238,0.2)', color: '#22d3ee',
            borderRadius: 4, fontWeight: 700,
          }}>KEY</span>}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#8497ae' }}>{unit}</span>
      </label>
      <input
        id={id}
        type="number"
        className={`input${error ? ' error' : ''}`}
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={id === 'cfg-frames' ? 1 : 'any'}
        aria-invalid={!!error}
        onChange={e => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      {hint && <p id={`${id}-hint`} style={{ fontSize: '0.7rem', color: '#8497ae', marginTop: 4, lineHeight: 1.4 }}>{hint}</p>}
      {error && <p style={{ fontSize: '0.7rem', color: '#f87171', marginTop: 4 }}>{error}</p>}
    </div>
  );
}

interface Props {
  config: SimConfig;
  errors: Partial<Record<keyof SimConfig, string>>;
  loading: boolean;
  isRunning: boolean;
  stale: boolean;
  onConfigChange: (key: keyof SimConfig, value: number) => void;
  onRun: () => void;
  onReset: () => void;
  onScenario: (id: string) => void;
}

export function SimulationControls({
  config, errors, loading, stale,
  onConfigChange, onRun, onReset, onScenario,
}: Props) {
  return (
    <aside className="configuration-panel" style={{
      width: 280, minWidth: 260, flexShrink: 0,
      background: 'rgba(13,26,46,0.8)', border: '1px solid rgba(56,189,248,0.12)',
      borderRadius: 16, padding: 20,
      backdropFilter: 'blur(12px)',
    }}>
      <div className="panel-heading">⚙️ Configuration</div>

      {stale && (
        <div style={{
          background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)',
          borderRadius: 8, padding: '8px 10px', marginBottom: 14,
          fontSize: '0.75rem', color: '#fb923c',
        }}>
          ⚠️ Settings changed — run again to update results.
        </div>
      )}

      {/* Scenario shortcuts */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: '0.75rem', color: '#8497ae', marginBottom: 6 }}>Quick Scenario</p>
        <select
          className="input"
          style={{ cursor: 'pointer' }}
          onChange={e => { if (e.target.value) onScenario(e.target.value); }}
          value={Object.keys(SCENARIOS).find(id => sameConfig(config, SCENARIOS[id])) ?? ''}
          aria-label="Select a scenario preset"
        >
          <option value="">— Custom —</option>
          <option value="normal">Normal Delivery</option>
          <option value="delayed">Delayed ACK</option>
          <option value="adjusted">Adjusted Timeout</option>
        </select>
      </div>

      <div style={{ height: 1, background: 'rgba(56,189,248,0.1)', marginBottom: 14 }} />

      <Field id="cfg-frames"      label="Number of Messages"
        value={config.num_frames}      min={1}   max={20}  unit="frames"
        error={errors.num_frames}
        onChange={v => onConfigChange('num_frames', v)} />

      <Field id="cfg-data-travel" label="Data Travel Time"
        value={config.data_travel_ms}  min={1}   max={3600000}
        hint="Time for a data frame to reach the receiver."
        error={errors.data_travel_ms}
        onChange={v => onConfigChange('data_travel_ms', v)} />

      <Field id="cfg-ack-delay"   label="Receiver ACK Delay"  highlight
        value={config.ack_delay_ms}    min={0}   max={3600000}
        hint="Time the receiver waits before sending an ACK. Data and ACK travel times are configured separately."
        error={errors.ack_delay_ms}
        onChange={v => onConfigChange('ack_delay_ms', v)} />

      <Field id="cfg-ack-travel"  label="ACK Travel Time"
        value={config.ack_travel_ms}   min={1}   max={3600000}
        hint="Time for an ACK to travel back to the sender."
        error={errors.ack_travel_ms}
        onChange={v => onConfigChange('ack_travel_ms', v)} />

      <Field id="cfg-timeout"     label="Sender Timeout"  highlight
        value={config.timeout_ms}      min={1}   max={3600000}
        hint="Time sender waits before retransmitting. ACK arrival = data travel + ACK delay + ACK travel."
        error={errors.timeout_ms}
        onChange={v => onConfigChange('timeout_ms', v)} />

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          onClick={onRun}
          disabled={loading}
          id="btn-run"
        >
          {loading ? '⏳ Computing…' : '▶ Calculate & Animate'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onReset}
          aria-label="Reset simulation"
          id="btn-reset"
          title="Reset simulation"
        >
          ↺
        </button>
      </div>

      <p className="muted">Each timing input supports up to 3,600,000 ms (1 hour). For long runs use 100× / 1000× playback or Next Event. Extremely many retries are limited by the event budget.</p>
      {/* Formula reminder */}
      <div style={{
        marginTop: 16, padding: '10px 12px',
        background: 'rgba(7,13,26,0.6)', borderRadius: 8,
        border: '1px solid rgba(56,189,248,0.08)',
      }}>
        <p style={{ fontSize: '0.7rem', color: '#8497ae', lineHeight: 1.6 }}>
          <strong style={{ color: '#94a3b8' }}>ACK arrival time</strong><br />
          = data travel + ACK delay + ACK travel<br />
          <span style={{ color: '#22d3ee' }}>
            = {config.data_travel_ms} + {config.ack_delay_ms} + {config.ack_travel_ms} = <strong>
              {config.data_travel_ms + config.ack_delay_ms + config.ack_travel_ms} ms
            </strong>
          </span><br />
          {config.data_travel_ms + config.ack_delay_ms + config.ack_travel_ms > config.timeout_ms
            ? <span style={{ color: '#fb923c' }}>⚠️ ACK arrives AFTER timeout → retransmission expected</span>
            : <span style={{ color: '#4ade80' }}>✓ ACK arrives at or before timeout → no retransmission</span>
          }
        </p>
      </div>
    </aside>
  );
}
