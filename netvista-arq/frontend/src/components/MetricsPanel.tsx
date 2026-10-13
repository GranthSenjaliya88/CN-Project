// src/components/MetricsPanel.tsx
import type { LiveMetrics, SimResult } from '../types/simulation';

interface Props {
  live: LiveMetrics;
  result: SimResult | null;
}

export function MetricsPanel({ live, result }: Props) {
  const metrics = [
    { label: 'Transmissions',    val: live.transmissions,    color: '#60a5fa' },
    { label: 'Retransmissions',  val: live.retransmissions,  color: live.retransmissions > 0 ? '#fb923c' : '#60a5fa' },
    { label: 'Duplicates',       val: live.duplicates,       color: live.duplicates > 0 ? '#fb923c' : '#60a5fa' },
    { label: 'Delivered',        val: live.delivered,        color: '#4ade80' },
    { label: 'ACKs Sent',        val: live.acksSent,         color: '#a78bfa' },
    { label: 'Completion',
      val: live.completionTime !== null ? `${live.completionTime} ms` : '—',
      color: '#22d3ee' },
  ];

  return (
    <div>
      <div className="eyebrow" style={{marginTop:16}}>Live playback counters</div>
      {/* Live counters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {metrics.map(m => (
          <div key={m.label} className="metric-card" style={{ flex: '1 1 80px' }}>
            <span className="metric-val" style={{ color: m.color }}>{m.val}</span>
            <span className="metric-label">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Auto-generated explanation */}
      {result && result.success && (
        <div style={{
          marginTop: 12, padding: '14px 16px',
          background: 'rgba(13,26,46,0.8)', borderRadius: 10,
          border: '1px solid rgba(56,189,248,0.12)',
          fontSize: '0.82rem', lineHeight: 1.7, color: '#94a3b8',
        }}>
          <span style={{ color: '#22d3ee', fontWeight: 600 }}>Calculated final result (independent of playback): </span>
          {generateExplanation(result)}
          <p>ACKs accepted: {result.metrics.acks_accepted} · ACKs ignored: {result.metrics.acks_ignored} · All channel events finish: {result.metrics.all_events_finish_ms} ms</p>
        </div>
      )}
    </div>
  );
}

function generateExplanation(r: SimResult): string {
  const m = r.metrics;
  const c = r.config;
  const ackArrival = c.data_travel_ms + c.ack_delay_ms + c.ack_travel_ms;

  if (m.retransmissions === 0 && m.duplicate_data_arrivals === 0) {
    return `The ACK arrived at ${ackArrival} ms, at or before the ${c.timeout_ms} ms timeout. No retransmission occurred. All ${m.unique_messages_delivered} message(s) were delivered successfully.`;
  }

  return `The ACK would first arrive at ${ackArrival} ms, but the timeout was set to ${c.timeout_ms} ms — so the sender retransmitted ${m.retransmissions} time(s). The receiver discarded ${m.duplicate_data_arrivals} duplicate frame(s) using sequence numbers, ensuring each payload was delivered only once. Transfer completed at ${m.transfer_complete_time_ms} ms.`;
}
