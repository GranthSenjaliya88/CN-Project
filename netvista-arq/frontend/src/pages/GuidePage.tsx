export default function GuidePage() {
  return (
    <main style={{ paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            Project <span className="gradient-text">Guide</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>Why this project was made, what you can explore, and how to use the results.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 20 }}>

          <section className="glass" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Why this project was made</h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
              This project turns Stop-and-Wait ARQ with delayed acknowledgments into a visible,
              interactive experiment.
              It helps students connect protocol theory with the exact sequence of sending,
              receiving, waiting and retransmitting a frame.
            </p>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, marginTop: 12 }}>
              The central question is: what happens when the sender’s timer expires before the
              acknowledgment returns? Explore why a delayed ACK can cause an unnecessary retry,
              how sequence numbers prevent duplicate delivery, and how a suitable timeout avoids that retry.
            </p>
          </section>

          <section className="glass" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>What you can do</h2>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, color: '#cbd5e1', lineHeight: 1.7 }}>
              <li>Watch DATA frames and ACKs travel between sender and receiver in 3D or 2D.</li>
              <li>Change message count, DATA travel time, receiver ACK delay, ACK travel time and sender timeout.</li>
              <li>Observe sender and receiver states, the timeout countdown, retransmissions and duplicate rejection.</li>
              <li>Follow alternating sequence numbers 0 and 1 and check that each payload is delivered only once.</li>
              <li>Pause, replay, change playback speed or move to the next event to explain each step.</li>
              <li>Inspect packet timings, event logs and results; compare saved runs and export evidence as CSV or JSON.</li>
            </ul>
          </section>

          <section className="glass" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Three experiments to demonstrate</h2>
            <ol style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12, color: '#cbd5e1', lineHeight: 1.7 }}>
              <li><strong>Normal delivery:</strong> let the ACK arrive before timeout. The sender advances without retransmitting.</li>
              <li><strong>Delayed ACK:</strong> let timeout occur first. The sender retries the same frame; the receiver discards the duplicate payload and acknowledges it again.</li>
              <li><strong>Adjusted timeout:</strong> keep ACK delay unchanged and increase timeout. Show why the unnecessary retransmission disappears.</li>
            </ol>
            <p style={{ color: '#94a3b8', marginTop: 12, lineHeight: 1.7 }}>Use the scenario presets in the Simulator, then compare retries, duplicates, unique deliveries and completion time.</p>
          </section>

          <section className="glass" style={{ padding: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>How to understand the animation</h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.8 }}>Python calculates an event trace from your inputs. The animation and counters follow that trace; this is a teaching simulation, not traffic between real computers.</p>
            <p style={{ color: '#22d3ee', lineHeight: 1.8, marginTop: 12 }}>ACK return duration = DATA travel time + receiver ACK delay + ACK travel time.</p>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, marginTop: 12 }}>ACK delay is time spent waiting at the receiver. ACK travel is time spent returning to the sender. Playback speed only changes how quickly you watch the result, not the calculated protocol timings.</p>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, marginTop: 12 }}>Use the results in your technical explanation, screenshots and recorded presentation. The Theory &amp; Exam page connects the demonstration to a worked answer.</p>
          </section>

          {/* Limitations */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⚠️ Known Limitations</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem', color: '#94a3b8' }}>
              <li>• Stop-and-Wait with delayed ACKs only; no packet loss, corruption or reordering.</li>
              <li>• No reordering or jitter beyond fixed delays.</li>
              <li>• Maximum 20 frames and hard event cap of 5000 steps.</li>
              <li>• 3D scene uses WebGL — needs a GPU. Falls back gracefully.</li>
              <li>• Sequence diagram SVG has basic arrow matching; works correctly for all three reference scenarios.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="glass" style={{ padding: 24, marginTop: 24, textAlign: 'center', fontSize: '0.84rem', color: '#94a3b8' }}>
          <p>
            <strong style={{ color: '#94a3b8' }}>Student ID:</strong> 25CS096 &nbsp;|&nbsp;
            <strong style={{ color: '#94a3b8' }}>Subject:</strong> Computer Networks &nbsp;|&nbsp;
            <strong style={{ color: '#94a3b8' }}>Project:</strong> Stop-and-Wait ARQ with Delayed ACK
          </p>
          <p style={{ marginTop: 6 }}>
            NetVista ARQ · Python 3.12 + Flask + React 18 + Three.js r160 · Model v1.0
          </p>
        </div>
      </div>
    </main>
  );
}
