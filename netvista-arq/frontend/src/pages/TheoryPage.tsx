// src/pages/TheoryPage.tsx
import { useNavigate } from 'react-router-dom';
import { ARQLearningGuide } from '../components/ARQLearningGuide';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
      <div style={{
        minWidth: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg, #0891b2, #22d3ee)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '0.9rem', color: '#000', flexShrink: 0, marginTop: 2,
      }}>{n}</div>
      <div>
        <strong style={{ display: 'block', marginBottom: 6, color: '#f0f9ff' }}>{title}</strong>
        <div style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.7 }}>{children}</div>
      </div>
    </div>
  );
}

export default function TheoryPage() {
  const navigate = useNavigate();

  return (
    <main style={{ paddingTop: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

        <ARQLearningGuide />

        {/* Assumptions */}
        <div className="glass" style={{ padding: 28, marginBottom: 48 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1.1rem' }}>⚠️ Model Assumptions</h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Deterministic discrete-event model — no randomness.',
              'One sender and one receiver; one outstanding new data frame at a time.',
              'Fixed propagation delays throughout each run.',
              'No packet loss, corruption, or reordering.',
              'Serialisation and processing overhead not separately modelled.',
              'The receiver can receive frames while ACKs are still pending.',
              'Every received data copy (original or duplicate) schedules a separate ACK.',
              'ACK 0 acknowledges DATA 0; ACK 1 acknowledges DATA 1.',
              'Tie-breaking: when ACK arrival and timeout coincide at the same simulated time, the ACK is processed first.',
            ].map((a, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, color: '#94a3b8', fontSize: '0.88rem' }}>
                <span style={{ color: '#22d3ee', marginTop: 1 }}>•</span>{a}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Exam Question ── */}
        <div id="exam">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>
            Exam-Style Question & <span className="gradient-text">Worked Answer</span>
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 32 }}>A complete worked example based on the Delayed ACK scenario.</p>

          <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, color: '#22d3ee' }}>Question</h3>
            <div style={{
              padding: '20px 24px', background: 'rgba(7,13,26,0.6)',
              borderLeft: '3px solid #22d3ee', borderRadius: '0 10px 10px 0',
              fontSize: '0.9rem', lineHeight: 1.9, color: '#cbd5e1',
            }}>
              A sender uses Stop-and-Wait ARQ with one unique data frame.<br />
              Data travel time = <strong>100 ms</strong>, receiver ACK delay = <strong>900 ms</strong>,
              ACK travel time = <strong>100 ms</strong>, sender timeout = <strong>600 ms</strong>.<br />
              No frames are lost or corrupted.<br /><br />
              (a) When does retransmission occur?<br />
              (b) How does the receiver handle the retransmitted frame?<br />
              (c) When does the sender complete the transfer?<br />
              (d) How many duplicate frames arrive at the receiver?
            </div>
          </div>

          <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 20, color: '#4ade80' }}>Worked Answer</h3>
            {[
              { title: 'Original frame sent (t = 0 ms)', body: 'The sender transmits DATA 0 (Message 1, seq=0, attempt 1) and starts a 600 ms timer at t = 0; it expires at t = 600 ms.' },
              { title: 'Receiver accepts frame (t = 100 ms)', body: 'DATA 0 arrives. Sequence 0 matches expected seq 0, so the payload is delivered. Expected seq advances to 1. ACK 0 is scheduled to be sent at t = 100 + 900 = 1000 ms.' },
              { title: 'Sender timeout (t = 600 ms)', body: 'The timer expires. The ACK has not arrived yet (it will be sent at 1000 ms and arrive at 1100 ms). The sender retransmits DATA 0 (attempt 2) and restarts its timer.' },
              { title: 'Receiver discards duplicate (t = 700 ms)', body: 'Retransmitted DATA 0 arrives. Sequence 0 does NOT match expected seq 1 → duplicate. Payload is NOT delivered again. A second ACK 0 is scheduled for t = 700 + 900 = 1600 ms.' },
              { title: 'Original ACK sent (t = 1000 ms)', body: 'ACK 0 for the original frame is emitted. It will travel 100 ms.' },
              { title: 'Transfer complete (t = 1100 ms)', body: 'ACK 0 arrives at the sender. Timer cancelled. Since all 1 frame has been acknowledged, transfer is complete.' },
              { title: 'Stale ACK arrives (t = 1700 ms)', body: 'The ACK for the duplicate frame arrives. The sender ignores it — transfer is already complete. acks_ignored increments.' },
            ].map((s, i) => (
              <Step key={i} n={i + 1} title={s.title}>{s.body}</Step>
            ))}

            <div style={{
              marginTop: 24, padding: '16px 20px',
              background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
              borderRadius: 10,
            }}>
              <h4 style={{ marginBottom: 12, color: '#22d3ee', fontWeight: 700 }}>Summary</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                {[
                  ['Retransmission at', '600 ms'],
                  ['Total transmissions', '2'],
                  ['Duplicates received', '1'],
                  ['Unique payloads delivered', '1'],
                  ['Transfer complete at', '1,100 ms'],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid rgba(56,189,248,0.08)' }}>
                    <td style={{ padding: '8px 0', color: '#94a3b8' }}>{k}</td>
                    <td style={{ padding: '8px 0', fontWeight: 700, color: '#f0f9ff', textAlign: 'right' }}>{v}</td>
                  </tr>
                ))}
              </table>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => {
                sessionStorage.setItem('arq_scenario', 'delayed');
                navigate('/simulator');
              }}>
                ▶ Run This Example in Simulator
              </button>
            </div>
          </div>

          {/* Practice questions */}
          <div className="glass" style={{ padding: 28 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Practice Questions</h3>

            <details style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#22d3ee', marginBottom: 8 }}>
                Q1: With data travel = 50ms, ACK delay = 200ms, ACK travel = 50ms, timeout = 400ms — does retransmission occur?
              </summary>
              <div style={{ padding: '12px 0 0', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.7 }}>
                ACK arrival = 50 + 200 + 50 = <strong>300 ms</strong>. Timeout = 400 ms. 300 ms &lt; 400 ms.
                <strong style={{ color: '#4ade80' }}> No retransmission.</strong> The ACK arrives before the timeout.
              </div>
            </details>

            <details>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#22d3ee', marginBottom: 8 }}>
                Q2: For 2 messages with normal delivery settings, what are the sequence numbers of each delivered message?
              </summary>
              <div style={{ padding: '12px 0 0', color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.7 }}>
                Message 1 uses sequence <strong>0</strong>. Message 2 uses sequence <strong>1</strong>.
                Sequences alternate: 0, 1, 0, 1, … regardless of retransmissions.
              </div>
            </details>
          </div>

          {/* References */}
          <div className="glass" style={{ padding: 24, marginTop: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>References</h3>
            <p style={{marginBottom:12}}>Verified open reference: <a href="https://intronetworks.cs.luc.edu/current2/html/slidingwindows.html#building-reliable-transport-stop-and-wait" target="_blank" rel="noreferrer">Peter L. Dordal, An Introduction to Computer Networks, section 8.1: Stop-and-Wait</a>. Covers retransmission, duplicate ACKs, and delayed acknowledgements.</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem', color: '#94a3b8' }}>
              <li>• Suggested reading: Forouzan, B.A., <em>Data Communications and Networking</em>. Use the edition assigned by your course.</li>
              <li>• Suggested reading: Tanenbaum, A.S. &amp; Wetherall, D., <em>Computer Networks</em>, data-link protocols.</li>
              <li>• Suggested reading: Stallings, W., <em>Data and Computer Communications</em>, error control and ARQ.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
