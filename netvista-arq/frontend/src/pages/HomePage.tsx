// src/pages/HomePage.tsx
import { useNavigate } from 'react-router-dom';
import { LiveHero } from '../components/LiveHero';

// ── Page ──────────────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id: 'normal',   icon: '🟢', label: 'Normal Delivery',   desc: 'ACK delay 100ms · Timeout 800ms' },
  { id: 'delayed',  icon: '🟠', label: 'Delayed ACK',        desc: 'ACK delay 900ms · Timeout 600ms' },
  { id: 'adjusted', icon: '🔵', label: 'Adjusted Timeout',   desc: 'ACK delay 900ms · Timeout 1400ms' },
];

const CONCEPTS = [
  { icon: '📤', title: 'Send & Wait', desc: 'The sender transmits one frame and waits for an ACK before sending the next. Only one unacknowledged frame at a time.' },
  { icon: '⏱️', title: 'Timeout & Retry', desc: 'If the ACK doesn\'t arrive within the timeout window, the sender retransmits the same frame with the same sequence number.' },
  { icon: '🔍', title: 'Detect Duplicates', desc: 'Alternating sequence numbers (0, 1) let the receiver identify and discard duplicate frames, delivering each payload only once.' },
];

export default function HomePage() {
  const navigate = useNavigate();

  const goSim = (scenario?: string) => {
    if (scenario) {
      sessionStorage.setItem('arq_scenario', scenario);
    }
    navigate('/simulator');
  };

  return (
    <main style={{ paddingTop: 64 }}>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 24px 40px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(14,116,144,0.25) 0%, transparent 70%)',
        position: 'relative',
      }}>
        {/* Background grid */}
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

        <div style={{ textAlign: 'center', maxWidth: 1200, width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 16px', marginBottom: 24,
            background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)',
            borderRadius: 999, fontSize: '0.8rem', color: '#22d3ee', fontWeight: 600,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', animation: 'pulse 2s infinite' }} />
            Computer Networks · Stop-and-Wait ARQ · Student ID 25CS096
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20 }}>
            Stop-and-Wait ARQ<br />
            <span className="gradient-text">with Delayed ACK</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 580, margin: '0 auto 32px', lineHeight: 1.7 }}>
            See how ACK delays and sender timeouts cause retransmissions, and how alternating
            sequence numbers prevent duplicate data delivery.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            <button className="btn btn-primary" onClick={() => goSim()} id="btn-launch-sim"
              style={{ padding: '14px 32px', fontSize: '1rem' }}>
              🚀 Launch Simulator
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/theory')}
              style={{ padding: '14px 32px', fontSize: '1rem' }}>
              📖 Understand the Protocol
            </button>
          </div>

          <LiveHero />
        </div>
      </section>

      {/* ── Concept cards ── */}
      <section style={{ padding: '60px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 700, marginBottom: 40 }}>
          Core Concepts
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {CONCEPTS.map(c => (
            <div key={c.title} className="glass" style={{ padding: 28 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.icon}</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, color: '#f0f9ff' }}>{c.title}</h3>
              <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.9rem' }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Scenario shortcuts ── */}
      <section style={{
        padding: '40px 24px 60px', maxWidth: 800, margin: '0 auto', textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>Start with a Demonstration</h2>
        <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: '0.9rem' }}>
          Each preset loads the simulator with pre-configured settings. Results are calculated by Python, not hardcoded.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => goSim(s.id)}
              className="glass"
              style={{
                padding: '18px 24px', cursor: 'pointer', border: '1px solid rgba(56,189,248,0.12)',
                borderRadius: 12, textAlign: 'left', minWidth: 200,
                transition: 'all 0.2s', background: 'rgba(13,26,46,0.6)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.12)')}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Learning outcomes ── */}
      <section style={{
        background: 'rgba(13,26,46,0.4)', borderTop: '1px solid rgba(56,189,248,0.08)',
        borderBottom: '1px solid rgba(56,189,248,0.08)', padding: '50px 24px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
            What You Will Learn
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
            {[
              'How Stop-and-Wait ARQ works step by step',
              'Why the sender can only have one outstanding frame',
              'What happens when an ACK is delayed',
              'When and why retransmission occurs',
              'How sequence numbers detect duplicates',
              'Why duplicate payloads must not be delivered twice',
              'How changing the timeout affects retransmissions',
              'The formula: ACK arrival = data travel + ACK delay + ACK travel',
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '10px 0',
              }}>
                <span style={{ color: '#22d3ee', marginTop: 2 }}>✓</span>
                <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '30px 24px', textAlign: 'center',
        color: '#8497ae', fontSize: '0.8rem',
        borderTop: '1px solid rgba(56,189,248,0.06)',
      }}>
        <p>
          <strong style={{ color: '#94a3b8' }}>Student ID:</strong> 25CS096 &nbsp;·&nbsp;
          <strong style={{ color: '#94a3b8' }}>Subject:</strong> Computer Networks &nbsp;·&nbsp;
          <strong style={{ color: '#94a3b8' }}>Project:</strong> Stop-and-Wait ARQ with Delayed ACK
        </p>
        <p style={{ marginTop: 6 }}>
          NetVista ARQ Simulator · Model v1.0 · Built with React + Three.js + Flask
        </p>
      </footer>
    </main>
  );
}
