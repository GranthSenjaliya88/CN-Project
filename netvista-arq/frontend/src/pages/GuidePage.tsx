export default function GuidePage() {
  return (
    <main style={{ paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            Project <span className="gradient-text">Guide</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>Scope and limitations of the Stop-and-Wait ARQ simulation.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 20 }}>

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
