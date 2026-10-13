// src/pages/GuidePage.tsx
  const CodeBlock = ({ children }: { children: string }) => (
    <div style={{
      background: 'rgba(7,13,26,0.9)', borderRadius: 8, padding: '14px 18px',
      fontFamily: 'JetBrains Mono, monospace', fontSize: '0.82rem',
      border: '1px solid rgba(56,189,248,0.12)', lineHeight: 1.8,
      color: '#22d3ee', whiteSpace: 'pre', overflowX: 'auto',
      marginBottom: 12,
    }}>
      {children}
    </div>
  );

export default function GuidePage() {
  return (
    <main style={{ paddingTop: 80 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>

        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>
            Project <span className="gradient-text">Guide</span>
          </h1>
          <p style={{ color: '#94a3b8' }}>Installation, architecture, testing, and submission notes.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 20 }}>

          {/* Quick start */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🚀 Quick Start</h3>
            <p className="muted" style={{marginBottom:12}}>Already built? Run <code>python backend/app.py</code> from netvista-arq and open http://127.0.0.1:5000. The steps below are for development.</p>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginBottom: 12 }}>1. Start the Flask backend:</p>
            <CodeBlock>{`cd netvista-arq/backend
pip install -r requirements.txt
python app.py
# → Running on http://localhost:5000`}</CodeBlock>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginBottom: 12 }}>2. Start the React frontend (separate terminal):</p>
            <CodeBlock>{`cd netvista-arq/frontend
npm ci
npm run dev
# → Open http://localhost:3000`}</CodeBlock>
          </div>

          {/* Architecture */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🏗️ Architecture</h3>
            <div style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.8 }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.78rem', color: '#22d3ee', marginBottom: 12,
                background: 'rgba(7,13,26,0.8)', padding: '12px 14px', borderRadius: 8 }}>
                {`React (Vite + TypeScript)
       ↓ POST /api/simulate
   Flask (Python 3.12)
       ↓
  simulator/engine.py
  (pure event queue)
       ↓
  JSON event trace
       ↓
React playback + R3F scene`}
              </div>
              <ul style={{ listStyle: 'none', gap: 6, display: 'flex', flexDirection: 'column' }}>
                <li>• <strong>engine.py</strong> — priority queue, stale timer protection</li>
                <li>• <strong>models.py</strong> — typed dataclasses for all data</li>
                <li>• <strong>validation.py</strong> — field-level input validation</li>
                <li>• <strong>app.py</strong> — Flask routes, CORS</li>
                <li>• <strong>SimulatorPage.tsx</strong> — RAF playback loop</li>
                <li>• <strong>NetworkScene.tsx</strong> — React Three Fiber 3D</li>
                <li>• <strong>playback.ts</strong> — pure state derivation</li>
              </ul>
            </div>
          </div>

          {/* Tests */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>✅ Running Tests</h3>
            <CodeBlock>{`cd netvista-arq/backend
python -m pytest tests/test_engine.py -v`}</CodeBlock>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', lineHeight: 1.7 }}>
              34 tests cover: normal delivery, delayed ACK, adjusted timeout, duplicate suppression,
              stale timer safety, multiple timeouts, tie-breaking (ACK vs timeout), zero ACK delay,
              input validation, and event-count protection.
            </p>
          </div>

          {/* Project structure */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>📁 Project Structure</h3>
            <div style={{
              fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#22d3ee',
              background: 'rgba(7,13,26,0.8)', padding: '14px 16px', borderRadius: 8, lineHeight: 1.9,
            }}>
              {`netvista-arq/
  backend/
    app.py
    requirements.txt
    simulator/
      engine.py   ← simulation logic
      models.py   ← types
      validation.py
    tests/
      test_engine.py
  frontend/
    src/
      pages/      ← route pages
      components/ ← reusable React
      simulation/ ← playback.ts
      services/   ← api.ts
      types/      ← TypeScript types
    vite.config.ts
  docs/
    report.md
    recording-guide.md`}
            </div>
          </div>

          {/* Vite proxy */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔌 Frontend–Backend Proxy</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginBottom: 10 }}>
              The Vite dev server proxies <code>/api/*</code> to Flask on port 5000,
              so no CORS issues during development:
            </p>
            <CodeBlock>{`// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}`}</CodeBlock>
          </div>

          {/* Limitations */}
          <div className="glass" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>⚠️ Known Limitations</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.84rem', color: '#94a3b8' }}>
              <li>• No packet loss or corruption modelled (by design).</li>
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
            NetVista ARQ · Python 3.12 + Flask + React 19 + Three.js r160 · Model v1.0
          </p>
        </div>
      </div>
    </main>
  );
}
