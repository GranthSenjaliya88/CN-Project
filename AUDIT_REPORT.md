# Project Audit Report: Stop-and-Wait ARQ with Delayed ACK

**Audit Stage**: Stage 1 — Inspection, Baseline Establishment & Feature Inventory  
**Date**: October 13, 2026  
**Auditor**: Antigravity Assistant  
**Subject**: Computer Networks · Stop-and-Wait ARQ · Student ID 25CS096  

---

## 1. Executive Summary

This report establishes the baseline health, architecture, test verification, and feature set of the "Stop-and-Wait ARQ with Delayed ACK" repository.

The project exists in two parallel implementations:
1. **Modern Architecture (`netvista-arq/`)**: A modular, decoupled application featuring a Python 3.12 Flask REST backend with an event-driven discrete simulation engine, 72 automated pytest tests, and a React 18 + Vite + TypeScript frontend with a 3D Three.js/React Three Fiber scene, Recharts comparison graphs, 2D SVG sequence diagram, and CSV exports.
2. **Legacy Prototype (Root directory)**: A monolithic Flask app (`app.py`, `simulator.py`, `templates/index.html`) tested by 6 unit tests (`tests/test_simulator.py`).

Both systems were inspected, tests executed, services started, and code analyzed. All automated tests in both systems execute with **100% pass rates**.

---

## 2. Environment & System Inspection

| Property | Value Observed | Status |
| :--- | :--- | :--- |
| **Operating System** | Windows 11 (win32) | PASS |
| **Python Version** | Python 3.12.10 | PASS |
| **Node.js Version** | v24.19.0 | PASS |
| **npm Version** | 11.17.0 | PASS |
| **pytest Version** | pytest 9.1.1 (pluggy 1.6.0, anyio 4.14.2) | PASS |
| **Git Repository** | Not initialized (no `.git` directory found) | PASS |
| **Workspace Root** | `c:\Users\grant\Desktop\CN project` | PASS |

---

## 3. Baseline Verification Checklist

Each check has been executed and evaluated against the three criteria:
- **PASS**: Executed and verified.
- **FAIL**: Executed and incorrect.
- **UNVERIFIED**: Not executed or not inspectable.

| Category | Check Description | Verification Command / Evidence | Result | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Tests** | Root legacy engine unit tests | `pytest tests/` | **PASS** | 6 passed in 0.04s (`tests\test_simulator.py`). |
| **Tests** | Modern backend engine tests | `pytest tests/test_engine.py` | **PASS** | 34 passed in 0.08s. |
| **Tests** | Modern backend edge-case tests | `pytest tests/test_edge_cases.py` | **PASS** | 38 passed in 0.07s. |
| **Tests** | Modern backend combined suite | `pytest` in `netvista-arq/backend` | **PASS** | 72 passed in 0.15s across 2 test files. |
| **Build** | Frontend TypeScript compilation & Vite bundle | `npm run build` in `netvista-arq/frontend` | **PASS** | `tsc -b && vite build` built 1232 modules in 970ms, exited 0. |
| **Linter** | Frontend static analysis (oxlint) | `npm run lint` in `netvista-arq/frontend` | **PASS** | 0 errors, 9 warnings across 20 files. |
| **Service** | Modern Flask backend startup | `python app.py` on port 5000 | **PASS** | Task background process running; responded to health probe. |
| **Service** | Modern Flask API health check | `GET http://127.0.0.1:5000/api/health` | **PASS** | Responded with HTTP 200: `{"status": "ok", "version": "1.0"}`. |
| **Service** | Modern Flask simulation API | `POST http://127.0.0.1:5000/api/simulate` | **PASS** | Successfully calculated scenario trace and metrics. |
| **Service** | Frontend Vite development server | `npm run dev` on port 3000 | **PASS** | Server ready on `http://localhost:3000/`, proxying `/api` to port 5000. |
| **Visual** | Headless browser direct capture | Antigravity Browser subagent | **UNVERIFIED** | Playwright win32 driver CDN download failed (404); inspected via code and running dev servers. |
| **Assets** | Legacy root static stylesheet | Inspected `templates/index.html` link to `/static/css/style.css` | **FAIL** | Directory `/static/` does not exist in root; legacy page loads unstyled. |

---

## 4. Architecture Overview

### 4.1 Modern Application (`netvista-arq/`)

```
Browser Client (React 18 + TS + Vite on http://localhost:3000)
    │
    ├── /api/* requests (proxied via Vite)
    ▼
Flask REST API (Python 3.12 on http://localhost:5000)
    │
    ├── /api/health    -> Health status
    ├── /api/scenarios -> Reference scenario presets
    └── /api/simulate  -> SimConfig validation & execution
           │
           ▼
    Discrete-Event Engine (simulator/engine.py)
           │  • Min-heap priority queue (heapq)
           │  • Priority 0: ACK_ARRIVED
           │  • Priority 1: DATA_ARRIVED
           │  • Priority 2: ACK_SEND
           │  • Priority 3: TIMEOUT
           │  • Deterministic tie-breaking & timer tokens
           ▼
    SimResult JSON Response
           │  • Events trace (actor, sequence, timestamp, description)
           │  • Animation hints (packet_launch, timeouts, arrivals)
           │  • Performance metrics & delivered payloads
           ▼
Client State & Presentation:
    ├── RAF Playback Engine (simulation/playback.ts) -> Computes live state
    ├── 3D Workstation Scene (NetworkScene.tsx) -> R3F WebGL rendering
    ├── 2D Sequence Diagram (SequenceDiagram.tsx) -> SVG ladder timeline
    ├── Comparative Analytics (ExperimentsPage.tsx) -> Recharts bar charts
    ├── Live Metrics & Logs (MetricsPanel.tsx, EventLog.tsx)
    └── Educational Modules (TheoryPage.tsx, GuidePage.tsx)
```

### 4.2 Legacy Application (Root Directory)

- Monolithic Python file `simulator.py` with standalone function `simulate()`.
- Single Flask file `app.py` serving Jinja template `templates/index.html` and `/api/simulate`.
- 6 unit tests in `tests/test_simulator.py`.

---

## 5. How to Run the Project

### 5.1 Running the Modern Application (`netvista-arq/`)

#### Step 1: Start the Backend (Terminal 1)
```powershell
cd "c:\Users\grant\Desktop\CN project\netvista-arq\backend"
pip install -r requirements.txt
python app.py
# Backend runs on http://127.0.0.1:5000
```

#### Step 2: Start the Frontend (Terminal 2)
```powershell
cd "c:\Users\grant\Desktop\CN project\netvista-arq\frontend"
npm install
npm run dev
# Open http://localhost:3000 in your browser
```

#### Step 3: Run Backend Tests
```powershell
cd "c:\Users\grant\Desktop\CN project\netvista-arq\backend"
pytest -v
# Executes 72 tests across test_engine.py and test_edge_cases.py
```

#### Step 4: Run Frontend Linter and Production Build
```powershell
cd "c:\Users\grant\Desktop\CN project\netvista-arq\frontend"
npm run lint
npm run build
```

---

### 5.2 Running the Legacy Application (Root)

```powershell
cd "c:\Users\grant\Desktop\CN project"
pip install -r requirements.txt
python app.py
# Runs on http://127.0.0.1:5000 serving templates/index.html
```

To run legacy tests:
```powershell
cd "c:\Users\grant\Desktop\CN project"
pytest tests/
# Executes 6 tests in tests/test_simulator.py
```

---

## 6. Features That Must Be Preserved

Under Stage 1 rules, the following capabilities must be strictly preserved in all subsequent stages:

1. **Protocol Accuracy & Backend Engine**:
   - Discrete-event min-heap simulation in Python (`engine.py`).
   - Tie-breaking rule where ACK arrival cancels a simultaneous timeout.
   - Alternating sequence numbers ($0$ and $1$).
   - Duplicate frame detection and suppression at the receiver.
   - Separate forward data travel and return ACK travel timing.
   - Python calculations must never be replaced with fabricated frontend results.
2. **React Pages & Client Routing**:
   - All 5 routes: `/` (Home), `/simulator` (Simulator), `/experiments` (Experiments), `/theory` (Theory), `/guide` (Guide).
   - Student ID reference `25CS096`.
3. **3D Interactive Scene**:
   - Three.js / React Three Fiber interactive scene (`NetworkScene.tsx`).
   - 3D workstation representations for Sender and Receiver.
   - In-flight 3D packet models with trajectory interpolation and live labels.
   - Timeout visual indicator ring.
   - Orbit controls for user interaction.
4. **2D Sequence Diagram**:
   - Scaled SVG sequence ladder diagram tracing transmissions, ACKs, and timeouts.
5. **Interactive Controls**:
   - Parameter inputs for frames ($1$ to $20$), data travel, ACK delay, ACK travel, timeout.
   - Playback controls: Pause/Resume, Next Event step, Replay, Reset, Speed multipliers ($0.25\times$ to $4\times$).
   - Quick preset selector for the 3 reference scenarios.
6. **Data Visualizations & Exports**:
   - Recharts bar graphs on the Experiments page.
   - Structured comparison table.
   - CSV export for simulation event log (`arq_events.csv`).
   - CSV export for experimental comparisons (`arq_comparison.csv`).
7. **Educational & Reference Content**:
   - Formula explanation and real-time comparison with timeout.
   - Worked exam problem with step-by-step chronology.
   - Collapsible practice questions.
   - Textbook references (Forouzan, Tanenbaum, Stallings).
8. **Test Suites**:
   - All 72 tests in `netvista-arq/backend/tests/`.
   - All 6 tests in `tests/test_simulator.py`.

---

## 7. Confirmed Problems to Address in Later Stages

The following concrete defects and limitations were verified during baseline inspection:

1. **Missing CSS Asset in Legacy Prototype**:
   - `templates/index.html` references `/static/css/style.css`, but the `static/` directory does not exist in the root folder.
2. **Oxlint React Static-Component Anti-pattern**:
   - In `GuidePage.tsx`, `CodeBlock` is declared inside the `GuidePage()` render function. It must be moved outside the component body.
3. **Cascading State Updates in Effects**:
   - In `SimulatorPage.tsx` and `AppNavigation.tsx`, synchronous `setState` calls inside `useEffect` trigger unnecessary render cascades and linter warnings.
4. **Non-interactive Timeline Progress Bar**:
   - In `PlaybackControls.tsx`, the timeline is rendered as a passive `<div>` progress bar rather than an interactive scrubber input (`<input type="range">`), preventing manual seeking.
5. **Absence of Dedicated 2D Simulation Fallback**:
   - If WebGL is unavailable or fails to initialize, the main simulator viewport has no graceful fallback toggle to switch to a 2D canvas simulation.
6. **Mutating Sequence Diagram State in Render**:
   - `SequenceDiagram.tsx` mutates and deletes from an in-memory Map during SVG arrow resolution.
7. **Production Bundle Chunk Size**:
   - `npm run build` produces a single oversized bundle ($1.57\text{ MB}$) due to lack of dynamic code-splitting for Three.js and Recharts.
8. **Documentation Port Mismatch**:
   - `GuidePage.tsx` directs users to port `5173`, whereas `vite.config.ts` runs on port `3000`.
9. **Backend Root 404 & Port Separation**:
   - Opening `http://localhost:5000/` directly returns a 404 because `backend/app.py` only binds `/api/*` endpoints (the web application runs on port `3000`). Providing an informative JSON or redirect at `/` will prevent user confusion.


---
# Stages 2-7: Executed audit and enhancements
Date: 13 October 2026. Auditor: Codex. This addendum preserves the original Stage 1 report above; the verified results below supersede its baseline findings.

## Scope and preservation
Work was performed directly in `C:/Users/grant/Desktop/CN project`, the Antigravity project. Antigravity IDE was launched with that folder. The separate Documents/ChatGPT workspace contains the before-edit ZIP and SHA-256 manifest. All 52 original source/document/asset files remain present. All original Python test files and the dependency lockfile are unchanged. No dependencies were downgraded, no pages were removed, and the React/Python/3D architecture is retained. Generated dist assets were rebuilt normally.

The five routes, original workstations/packet scene, camera orbit, sequence diagram, original playback controls, both CSV formats, charts, theory/practice content, and original test suites remain available. Visual refinements retain the navy/cyan/green palette.

## Confirmed fixes and enhancements
- Backend rejects fractional and boolean frame counts, boolean timing inputs, invalid/nonfinite values and non-object JSON without an internal-server error. Frontend and backend maximum timing limits now agree.
- Reset and unmount invalidate/abort pending requests; stale request responses cannot restore an old simulation. A synchronous request guard prevents conflicting run actions.
- Runtime API-response validation prevents malformed traces from entering playback.
- Replaced cascading live-state effects with memoized derivation from one playback clock. RAF loop stops at completion, is cancelled on unmount/pause, and does not advance while the document is hidden.
- Added keyboard-operable timeline seeking; backward seeking reconstructs the same trace. Added camera reset, reduced-motion/start-paused control, and a companion 2D view plus render-error boundary.
- Replaced remotely fetched 3D font labels with readable HTML labels. Core simulator no longer requires Google Fonts. Workstation and packet motion follows simulation time.
- Added receiver next-ACK countdown. Distinguished live counters, calculated final results, transfer completion and channel-drain completion.
- Added JSON run download, print styling and saved custom comparisons (up to 30 in browser storage). Preserved event/comparison CSV and added complete run settings, escaping and units.
- Charts now display only calculated runs, not fabricated zero results for scenarios never run.
- Sequence diagram pairs arrows using actual arrival timestamps and preserves in-flight progress; event rows have readable spacing explicitly labelled as non-proportional.
- Fixed mobile navigation state, hamburger visibility, narrow-screen grids, log wrapping, low-contrast labels, incorrect page title and documented port.
- Split routes into lazy chunks instead of one 1.57 MB entry bundle. The entry is about 161 kB; the shared 3D chunk remains about 821 kB uncompressed, with a retained build size warning.
- Flask now serves the built React app and API together on 127.0.0.1:5000, including direct SPA routes. Vite development remains on port 3000. Backend debug mode is off.
- Added START_LAB.cmd, README, reviewed report draft, slide outline, recording guide, submission checklist and actual exported evidence.
- Fixed the exam narrative: timer starts at 0 ms and expires at 600 ms. Clarified one outstanding logical message versus overlapping retransmission copies.
- Added a consulted open networking reference (Peter L. Dordal, section 8.1). Retained all three suggested textbook readings while removing unverified chapter/edition claims.
- Restored missing legacy stylesheet as an additive file. Legacy JavaScript files were already absent and were not recreated; the legacy prototype is retained historical source, not the audited primary website.

## Executed commands and results
| Check | Command / evidence | Status |
|---|---|---|
| Modern backend | `python -m pytest -q` in netvista-arq/backend: 125 passed | PASS |
| Original legacy tests | `python -m pytest tests -q` from project root: 6 passed | PASS |
| Frontend pure logic/API-contract/export tests | `npm test`: 26 passed | PASS |
| TypeScript and production bundle | `npm run build` | PASS |
| Lint | `npm run lint`: no warnings/errors | PASS |
| Lockfile/install resolution | `npm ci --dry-run --ignore-scripts` | PASS (dry run only) |
| Production routes | HTTP 200 for /, /simulator, /experiments, /theory, /guide, /api/health | PASS |
| Source preservation | SHA-256 baseline: no original file removed; original tests/lockfile unchanged | PASS |

There are 157 passing automated tests across the three suites. One backend test additionally checks 100 deterministic parameter configurations for delivery, ACK counts, chronological events and reproducibility. Tests must be invoked separately: root-wide pytest collection collides between the two historical modules both named simulator. This initial collection error is documented, not counted as a successful run.

## Reference experiments: expected and actual
Shared settings: one message; data travel 100 ms; ACK return 100 ms.

| Scenario | ACK delay | Timeout | Transmissions | Retransmissions | Duplicates | Delivered | Transfer complete | Channel finish | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Normal |100|800|1|0|0|1|300|300|PASS|
| Delayed |900|600|2|1|1|1|1100|1700|PASS|
| Adjusted |900|1400|1|0|0|1|1100|1100|PASS|

These values matched Python tests and browser runs. An additional custom browser run used 3 messages, data/ACK travel 100 ms, ACK delay 450 ms, and timeout 200 ms: 12 transmissions, 9 retransmissions, 9 duplicates, 3 delivered, 1950 ms transfer completion, 2550 ms channel finish. Sequence numbers were 0,1,0 and each payload appeared only once.

## Browser checks actually executed
PASS: active-playback Reset cleared state and counters; homepage/launch, simulator, experiments, theory route, practice-answer disclosure and exam-example shortcut; preset selection; custom input; fractional input rejection and recovery; paused-start; next-event stepping; timeline keyboard seek to end; backward reconstruction via replay; 0.25x speed; rapid pause/resume; stable paused time; 2D/3D toggle; camera reset; log filter; auto-scroll toggle; log collapse/expand; saved comparison navigation; all three comparison runs; JSON/event CSV/comparison CSV downloads. Downloaded files were reopened and compared (16 delayed-case events, completion 1100 ms).

PASS: desktop breakpoint 1440x1000 and narrow viewport 390x844; mobile navigation closes on route change; no page-level horizontal overflow on simulator/experiments at 390 px. Direct production simulator route runs the calculated animation after building. The receiver displays 2 pending ACKs and one delivered payload at the delayed-case 700 ms duplicate event.

PASS: intentionally stopped stale backend servers; UI showed a clear backend-unavailable message with no stale successful result. Restarted one current backend and verified successful recovery. The running production service is local-only.

PASS: production console capture showed no application errors from the production origin during the exercised paths. React Router future-version warnings remain informational. A transient Vite reload error during intermediate editing is not a final build error.

Screenshots are in netvista-arq/docs/screenshots. Download evidence is in netvista-arq/examples/results.

## Verification limits and remaining work
UNVERIFIED: fresh-machine installation (dry-run resolution was checked, not a clean operating system); print dialog/printer output; forced GPU/WebGL context loss on different hardware; long-duration heap/memory profiling; exhaustive browser/device coverage; injected delayed HTTP response race (guards were inspected; no network-injection browser tool was used). Camera reset was clicked; exhaustive orbit/zoom gesture testing was not performed. No claim of universal bug freedom is made.

Legacy prototype: its original Python tests pass and missing CSS is restored, but its previously absent static/js/animation.js and static/js/app.js remain absent. Use netvista-arq as the functional application. No working legacy feature was removed.

The 3D dependency chunk still triggers Vite's 500 kB advisory. It is route-split and browser operation was verified; no size warning was hidden. Further asset compression is optional.

Student tasks: review and understand code; personalise and convert the report to PDF; prepare final slides/visual material; record own narration; upload YouTube video; complete proforma and institution-required acknowledgement; verify Teams deadline and submission links. No video, upload, signature, or final student declaration has been fabricated.

## Run instructions
Double-click START_LAB.cmd from the project root, or run `python backend/app.py` from netvista-arq. Open http://127.0.0.1:5000. Keep the server running. If a server already occupies 5000, use that running app instead of starting a duplicate. For development, use Vite on localhost:3000 as described in README.md.

## Changed original files
- AUDIT_REPORT.md
- FEATURE_INVENTORY.md
- netvista-arq\backend\app.py
- netvista-arq\frontend\index.html
- netvista-arq\frontend\package.json
- netvista-arq\backend\simulator\validation.py
- netvista-arq\frontend\src\App.tsx
- netvista-arq\frontend\src\index.css
- netvista-arq\frontend\src\main.tsx
- netvista-arq\frontend\src\components\AppNavigation.tsx
- netvista-arq\frontend\src\components\DeliveredTray.tsx
- netvista-arq\frontend\src\components\EventLog.tsx
- netvista-arq\frontend\src\components\MetricsPanel.tsx
- netvista-arq\frontend\src\components\NetworkScene.tsx
- netvista-arq\frontend\src\components\PlaybackControls.tsx
- netvista-arq\frontend\src\components\SequenceDiagram.tsx
- netvista-arq\frontend\src\components\SimulationControls.tsx
- netvista-arq\frontend\src\components\StateCards.tsx
- netvista-arq\frontend\src\pages\ExperimentsPage.tsx
- netvista-arq\frontend\src\pages\GuidePage.tsx
- netvista-arq\frontend\src\pages\HomePage.tsx
- netvista-arq\frontend\src\pages\SimulatorPage.tsx
- netvista-arq\frontend\src\pages\TheoryPage.tsx
- netvista-arq\frontend\src\services\api.ts
- netvista-arq\frontend\src\simulation\playback.ts
- netvista-arq\frontend\src\types\simulation.ts


## Extended timing and packet inspection — 13 October 2026
- All four timing inputs now accept up to 3,600,000 ms; 600,000 ms and values above it are supported. Event-count protection remains active for excessive retries.
- Added 10x, 100x and 1000x playback.
- Enhanced 3D stations, direction arrows, packet message labels and arrival countdowns; redesigned 2D lanes with sequence labels, timer and pending ACK counts.
- Added packet inspector beneath playback with sender/receiver columns, message, sequence, attempt, send/arrival timestamps, travel/elapsed duration, playback-aware delivery outcome, DATA/ACK filtering and CSV export.
- Validation: 128 backend tests and 32 frontend tests passed; production build and lint passed. Browser verified a 600,000 ms ACK delay, initial scheduled rows, first arrival at 100 ms, completion, ACK filter and both scene modes. Existing bundle-size warning remains.
