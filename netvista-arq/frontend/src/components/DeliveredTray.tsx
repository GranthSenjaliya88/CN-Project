// src/components/DeliveredTray.tsx
import type { DeliveredMessage } from '../types/simulation';

interface Props {
  duplicateCount: number;
  currentTimeMs: number;
  allDelivered: DeliveredMessage[];
}

export function DeliveredTray({ duplicateCount, currentTimeMs, allDelivered }: Props) {
  // Only show items delivered up to current time
  const visible = allDelivered.filter(d => d.time_ms <= currentTimeMs);

  return (
    <div className="glass" style={{ padding: 16 }}>
      <div className="panel-heading">📦 Data Delivered to Application</div>

      {visible.length === 0 ? (
        <p style={{ color: '#8497ae', fontSize: '0.82rem' }}>No data delivered yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {visible.map((msg, i) => (
            <div key={i} className="animate-slide" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              background: 'rgba(74,222,128,0.07)',
              border: '1px solid rgba(74,222,128,0.2)',
              borderRadius: 8,
            }}>
              <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f0f9ff' }}>
                  Message {msg.message_id}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  Accepted from DATA {msg.seq} at {msg.time_ms} ms
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {duplicateCount > 0 && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: 'rgba(251,146,60,0.07)',
          border: '1px solid rgba(251,146,60,0.2)',
          borderRadius: 8, fontSize: '0.78rem', color: '#fb923c',
        }}>
          🔁 Duplicate copies discarded: <strong>{duplicateCount}</strong>
          <br />
          <span style={{ color: '#94a3b8' }}>Sequence numbers prevented duplicate data delivery.</span>
        </div>
      )}
    </div>
  );
}
