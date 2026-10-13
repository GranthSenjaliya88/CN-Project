// src/components/StateCards.tsx
// Sender and Receiver live state cards

import type { LiveSenderState, LiveReceiverState } from '../types/simulation';

function StateChip({ state }: { state: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    'Ready':           { bg: 'rgba(71,85,105,0.3)',  text: '#94a3b8' },
    'Waiting for ACK': { bg: 'rgba(34,211,238,0.15)', text: '#22d3ee' },
    'Retransmitting':  { bg: 'rgba(251,146,60,0.15)', text: '#fb923c' },
    'Complete':        { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
    'Frame Accepted':  { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
    'Duplicate Discarded': { bg: 'rgba(251,146,60,0.15)', text: '#fb923c' },
    'ACK Pending':     { bg: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
    'ACK Sent':        { bg: 'rgba(74,222,128,0.15)', text: '#4ade80' },
  };
  const c = colors[state] ?? { bg: 'rgba(71,85,105,0.3)', text: '#94a3b8' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 999,
      background: c.bg, color: c.text,
      fontSize: '0.75rem', fontWeight: 600,
    }}>{state}</span>
  );
}

interface SenderCardProps {
  state: LiveSenderState;
  currentTimeMs: number;
}

export function SenderStateCard({ state, currentTimeMs }: SenderCardProps) {
  const timerRemaining = state.timerStartMs !== null
    ? Math.max(0, state.timeoutMs - (currentTimeMs - state.timerStartMs))
    : null;

  const timerPct = timerRemaining !== null && state.timeoutMs > 0
    ? (timerRemaining / state.timeoutMs) * 100
    : 100;

  return (
    <div className="glass" style={{ padding: 18, minWidth: 200 }}>
      <div className="panel-heading">
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: '#22d3ee',
          boxShadow: '0 0 6px #22d3ee',
          animation: state.state === 'Waiting for ACK' ? 'pulse 1.5s infinite' : 'none',
        }} />
        SENDER
      </div>

      <Row label="State"><StateChip state={state.state} /></Row>
      <Row label="Message">{state.currentMessage ?? '—'}</Row>
      <Row label="Sequence">{state.sequence ?? '—'}</Row>
      <Row label="Attempt">{state.attempt ?? '—'}</Row>

      {timerRemaining !== null && (
        <>
          <Row label="Timeout">{state.timeoutMs} ms</Row>
          <Row label="Remaining">
            <span style={{ color: timerRemaining < state.timeoutMs * 0.25 ? '#f87171' : '#22d3ee' }}>
              {timerRemaining.toFixed(0)} ms
            </span>
          </Row>
          <div style={{ marginTop: 8 }}>
            <div style={{
              height: 6, background: 'rgba(255,255,255,0.05)',
              borderRadius: 3, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                width: `${timerPct}%`,
                background: timerPct > 50 ? '#22d3ee' : timerPct > 25 ? '#fb923c' : '#f87171',
                transition: 'width 0.1s linear, background 0.3s',
              }} />
            </div>
            <p style={{ fontSize: '0.65rem', color: '#8497ae', marginTop: 3 }}>Timer remaining</p>
          </div>
        </>
      )}
    </div>
  );
}

interface ReceiverCardProps {
  state: LiveReceiverState;
  currentTimeMs?: number;
}

export function ReceiverStateCard({ state, currentTimeMs = 0 }: ReceiverCardProps) {
  return (
    <div className="glass" style={{ padding: 18, minWidth: 200 }}>
      <div className="panel-heading">
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: '#4ade80',
          boxShadow: '0 0 6px #4ade80',
        }} />
        RECEIVER
      </div>

      <Row label="State"><StateChip state={state.state} /></Row>
      <Row label="Expected Seq">{state.expectedSeq}</Row>
      <Row label="Last Received">{state.lastReceivedSeq ?? '—'}</Row>
      <Row label="Last Outcome">
        {state.lastOutcome === 'accepted' && <span style={{ color: '#4ade80' }}>✓ Accepted</span>}
        {state.lastOutcome === 'duplicate' && <span style={{ color: '#fb923c' }}>✗ Duplicate</span>}
        {!state.lastOutcome && '—'}
      </Row>
      <Row label="Pending ACKs">{state.pendingAcks}</Row>
      {state.nextAckTimeMs !== null && <Row label="Next ACK in">{Math.max(0,state.nextAckTimeMs-currentTimeMs).toFixed(1)} ms</Row>}
      <Row label="Delivered">{state.uniqueDelivered}</Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 8, paddingBottom: 8,
      borderBottom: '1px solid rgba(56,189,248,0.06)',
    }}>
      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
        {children}
      </span>
    </div>
  );
}
