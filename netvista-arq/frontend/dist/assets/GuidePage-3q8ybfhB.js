import{t as e}from"./jsx-runtime-OQpaS_Dv.js";var t=e(),n=({children:e})=>(0,t.jsx)(`div`,{style:{background:`rgba(7,13,26,0.9)`,borderRadius:8,padding:`14px 18px`,fontFamily:`JetBrains Mono, monospace`,fontSize:`0.82rem`,border:`1px solid rgba(56,189,248,0.12)`,lineHeight:1.8,color:`#22d3ee`,whiteSpace:`pre`,overflowX:`auto`,marginBottom:12},children:e});function r(){return(0,t.jsx)(`main`,{style:{paddingTop:80},children:(0,t.jsxs)(`div`,{style:{maxWidth:1e3,margin:`0 auto`,padding:`0 24px 80px`},children:[(0,t.jsxs)(`div`,{style:{marginBottom:40},children:[(0,t.jsxs)(`h1`,{style:{fontSize:`1.8rem`,fontWeight:800,marginBottom:8},children:[`Project `,(0,t.jsx)(`span`,{className:`gradient-text`,children:`Guide`})]}),(0,t.jsx)(`p`,{style:{color:`#94a3b8`},children:`Installation, architecture, testing, and submission notes.`})]}),(0,t.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fit, minmax(min(100%, 400px), 1fr))`,gap:20},children:[(0,t.jsxs)(`div`,{className:`glass`,style:{padding:24},children:[(0,t.jsx)(`h3`,{style:{fontWeight:700,marginBottom:16},children:`🚀 Quick Start`}),(0,t.jsxs)(`p`,{className:`muted`,style:{marginBottom:12},children:[`Already built? Run `,(0,t.jsx)(`code`,{children:`python backend/app.py`}),` from netvista-arq and open http://127.0.0.1:5000. The steps below are for development.`]}),(0,t.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`0.84rem`,marginBottom:12},children:`1. Start the Flask backend:`}),(0,t.jsx)(n,{children:`cd netvista-arq/backend
pip install -r requirements.txt
python app.py
# → Running on http://localhost:5000`}),(0,t.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`0.84rem`,marginBottom:12},children:`2. Start the React frontend (separate terminal):`}),(0,t.jsx)(n,{children:`cd netvista-arq/frontend
npm ci
npm run dev
# → Open http://localhost:3000`})]}),(0,t.jsxs)(`div`,{className:`glass`,style:{padding:24},children:[(0,t.jsx)(`h3`,{style:{fontWeight:700,marginBottom:16},children:`🏗️ Architecture`}),(0,t.jsxs)(`div`,{style:{fontSize:`0.84rem`,color:`#94a3b8`,lineHeight:1.8},children:[(0,t.jsx)(`div`,{style:{fontFamily:`JetBrains Mono`,fontSize:`0.78rem`,color:`#22d3ee`,marginBottom:12,background:`rgba(7,13,26,0.8)`,padding:`12px 14px`,borderRadius:8},children:`React (Vite + TypeScript)
       ↓ POST /api/simulate
   Flask (Python 3.12)
       ↓
  simulator/engine.py
  (pure event queue)
       ↓
  JSON event trace
       ↓
React playback + R3F scene`}),(0,t.jsxs)(`ul`,{style:{listStyle:`none`,gap:6,display:`flex`,flexDirection:`column`},children:[(0,t.jsxs)(`li`,{children:[`• `,(0,t.jsx)(`strong`,{children:`engine.py`}),` — priority queue, stale timer protection`]}),(0,t.jsxs)(`li`,{children:[`• `,(0,t.jsx)(`strong`,{children:`models.py`}),` — typed dataclasses for all data`]}),(0,t.jsxs)(`li`,{children:[`• `,(0,t.jsx)(`strong`,{children:`validation.py`}),` — field-level input validation`]}),(0,t.jsxs)(`li`,{children:[`• `,(0,t.jsx)(`strong`,{children:`app.py`}),` — Flask routes, CORS`]}),(0,t.jsxs)(`li`,{children:[`• `,(0,t.jsx)(`strong`,{children:`SimulatorPage.tsx`}),` — RAF playback loop`]}),(0,t.jsxs)(`li`,{children:[`• `,(0,t.jsx)(`strong`,{children:`NetworkScene.tsx`}),` — React Three Fiber 3D`]}),(0,t.jsxs)(`li`,{children:[`• `,(0,t.jsx)(`strong`,{children:`playback.ts`}),` — pure state derivation`]})]})]})]}),(0,t.jsxs)(`div`,{className:`glass`,style:{padding:24},children:[(0,t.jsx)(`h3`,{style:{fontWeight:700,marginBottom:16},children:`✅ Running Tests`}),(0,t.jsx)(n,{children:`cd netvista-arq/backend
python -m pytest tests/test_engine.py -v`}),(0,t.jsx)(`p`,{style:{color:`#94a3b8`,fontSize:`0.84rem`,lineHeight:1.7},children:`34 tests cover: normal delivery, delayed ACK, adjusted timeout, duplicate suppression, stale timer safety, multiple timeouts, tie-breaking (ACK vs timeout), zero ACK delay, input validation, and event-count protection.`})]}),(0,t.jsxs)(`div`,{className:`glass`,style:{padding:24},children:[(0,t.jsx)(`h3`,{style:{fontWeight:700,marginBottom:16},children:`📁 Project Structure`}),(0,t.jsx)(`div`,{style:{fontFamily:`JetBrains Mono`,fontSize:`0.75rem`,color:`#22d3ee`,background:`rgba(7,13,26,0.8)`,padding:`14px 16px`,borderRadius:8,lineHeight:1.9},children:`netvista-arq/
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
    recording-guide.md`})]}),(0,t.jsxs)(`div`,{className:`glass`,style:{padding:24},children:[(0,t.jsx)(`h3`,{style:{fontWeight:700,marginBottom:16},children:`🔌 Frontend–Backend Proxy`}),(0,t.jsxs)(`p`,{style:{color:`#94a3b8`,fontSize:`0.84rem`,marginBottom:10},children:[`The Vite dev server proxies `,(0,t.jsx)(`code`,{children:`/api/*`}),` to Flask on port 5000, so no CORS issues during development:`]}),(0,t.jsx)(n,{children:`// vite.config.ts
server: {
  proxy: {
    '/api': 'http://localhost:5000'
  }
}`})]}),(0,t.jsxs)(`div`,{className:`glass`,style:{padding:24},children:[(0,t.jsx)(`h3`,{style:{fontWeight:700,marginBottom:16},children:`⚠️ Known Limitations`}),(0,t.jsxs)(`ul`,{style:{listStyle:`none`,display:`flex`,flexDirection:`column`,gap:8,fontSize:`0.84rem`,color:`#94a3b8`},children:[(0,t.jsx)(`li`,{children:`• Stop-and-Wait with delayed ACKs only; no packet loss, corruption or reordering.`}),(0,t.jsx)(`li`,{children:`• No reordering or jitter beyond fixed delays.`}),(0,t.jsx)(`li`,{children:`• Maximum 20 frames and hard event cap of 5000 steps.`}),(0,t.jsx)(`li`,{children:`• 3D scene uses WebGL — needs a GPU. Falls back gracefully.`}),(0,t.jsx)(`li`,{children:`• Sequence diagram SVG has basic arrow matching; works correctly for all three reference scenarios.`})]})]})]}),(0,t.jsxs)(`div`,{className:`glass`,style:{padding:24,marginTop:24,textAlign:`center`,fontSize:`0.84rem`,color:`#94a3b8`},children:[(0,t.jsxs)(`p`,{children:[(0,t.jsx)(`strong`,{style:{color:`#94a3b8`},children:`Student ID:`}),` 25CS096 \xA0|\xA0`,(0,t.jsx)(`strong`,{style:{color:`#94a3b8`},children:`Subject:`}),` Computer Networks \xA0|\xA0`,(0,t.jsx)(`strong`,{style:{color:`#94a3b8`},children:`Project:`}),` Stop-and-Wait ARQ with Delayed ACK`]}),(0,t.jsx)(`p`,{style:{marginTop:6},children:`NetVista ARQ · Python 3.12 + Flask + React 18 + Three.js r160 · Model v1.0`})]})]})})}export{r as default};