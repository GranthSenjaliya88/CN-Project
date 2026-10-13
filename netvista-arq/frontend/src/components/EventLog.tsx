// src/components/EventLog.tsx
import { useState, useRef, useEffect } from 'react';
import type { SimEvent } from '../types/simulation';

interface Props {
  events: SimEvent[];
  currentTimeMs: number;
  onExportCSV: () => void;
}

const ACTOR_COLORS: Record<string, string> = {
  SENDER: '#22d3ee',
  RECEIVER: '#4ade80',
  CHANNEL: '#a78bfa',
};

const EVENT_ICONS: Record<string, string> = {
  data_sent: '📤',
  data_arrived: '📥',
  payload_delivered: '✅',
  ack_scheduled: '📅',
  ack_sent: '📨',
  ack_arrived: '📬',
  ack_accepted: '✔️',
  ack_ignored: '🚫',
  timeout: '⏰',
  duplicate_discarded: '🔁',
  transfer_complete: '🏁',
};

export function EventLog({ events, currentTimeMs, onExportCSV }: Props) {
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Only show events up to current playback time
  const visibleEvents = events.filter(e =>
    e.time_ms <= currentTimeMs &&
    (filter === 'all' || e.actor === filter)
  );

  useEffect(() => {
    if (autoScroll && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [visibleEvents.length, autoScroll]);

  return (
    <div className="glass" style={{ marginTop: 12 }}>
      <div style={{
        display: 'flex', flexWrap:'wrap', gap:10, alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: expanded ? '1px solid rgba(56,189,248,0.08)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ background: 'none', border: 'none', color: '#22d3ee', cursor: 'pointer', fontSize: 16 }}
            aria-label={expanded ? 'Collapse log' : 'Expand log'}
          >
            {expanded ? '▼' : '▶'}
          </button>
          <span className="panel-heading" style={{ margin: 0 }}>📋 Event Log</span>
          <span style={{
            background: 'rgba(34,211,238,0.1)', color: '#22d3ee',
            padding: '1px 6px', borderRadius: 999, fontSize: '0.7rem',
          }}>
            {visibleEvents.length}
          </span>
        </div>

        {expanded && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="input"
              style={{ width: 'auto', fontSize: '0.75rem', padding: '4px 8px' }}
              value={filter}
              onChange={e => setFilter(e.target.value)}
              aria-label="Filter events by actor"
            >
              <option value="all">All</option>
              <option value="SENDER">Sender</option>
              <option value="RECEIVER">Receiver</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>
              <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
              Auto-scroll
            </label>
            <button className="btn btn-secondary btn-sm" disabled={!events.length} onClick={onExportCSV}>⬇ CSV</button>
          </div>
        )}
      </div>

      {expanded && (
        <div
          ref={bodyRef}
          style={{
            height: 240, overflowY: 'auto', padding: '8px 0',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem',
          }}
        >
          {visibleEvents.length === 0 && (
            <p style={{ color: '#8497ae', padding: '20px', textAlign: 'center' }}>
              {events.length === 0 ? 'Run the simulation to see events.' : 'No events match filter.'}
            </p>
          )}
          {visibleEvents.map((ev, i) => (
            <div
              key={i}
              className="animate-slide event-row"
              style={{
                display: 'flex', gap: 12, padding: '5px 16px',
                background: i === visibleEvents.length - 1 ? 'rgba(34,211,238,0.04)' : 'transparent',
                borderLeft: i === visibleEvents.length - 1 ? '2px solid rgba(34,211,238,0.3)' : '2px solid transparent',
              }}
            >
              <span style={{ color: '#8497ae', minWidth: 52 }}>
                {Number(ev.time_ms.toFixed(3))}ms
              </span>
              <span style={{ color: ACTOR_COLORS[ev.actor] ?? '#94a3b8', minWidth: 70 }}>
                {ev.actor}
              </span>
              <span style={{ marginRight: 4 }}>{EVENT_ICONS[ev.event_type] ?? '•'}</span>
              <span style={{ color: '#cbd5e1', flex: 1, minWidth:0, overflowWrap:'anywhere' }}>{ev.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
