# Feature Inventory: Stop-and-Wait ARQ with Delayed ACK

This document establishes the baseline feature inventory for the Stop-and-Wait ARQ simulation project. All existing capabilities and components listed here must be preserved throughout subsequent stages in accordance with project constraints.

---

## 1. Existing Pages & Routing

The primary modern web application is located in `netvista-arq/frontend` (React 18 + TypeScript + Vite + React Router DOM v6). A legacy single-page prototype exists in `templates/index.html`.

| Page Route | Component | Purpose & Contents |
| :--- | :--- | :--- |
| `/` | [`HomePage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/HomePage.tsx) | Hero introduction, animated 3D mini-preview canvas, student ID badge (`25CS096`), core concepts overview, quick launch buttons for 3 preset scenarios, and learning outcomes. |
| `/simulator` | [`SimulatorPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/SimulatorPage.tsx) | Main interactive simulator containing parameter controls, 3D Canvas scene, Sender/Receiver state cards, Delivered Message tray, playback toolbar, live metrics counters, event log, and 2D sequence diagram. |
| `/experiments` | [`ExperimentsPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/ExperimentsPage.tsx) | Empirical comparison workbench: runs all 3 reference presets against Python backend, displays comparative Recharts bar charts (retransmissions, duplicates, completion times), results comparison table, CSV export, and theoretical takeaways. |
| `/theory` | [`TheoryPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/TheoryPage.tsx) | Formal networking theory (ARQ concepts, alternating bits, duplicate suppression, ACK arrival formula), model assumptions, complete exam-style worked problem (Delayed ACK scenario), interactive practice questions with collapsible answers, and textbook citations. |
| `/guide` | [`GuidePage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/GuidePage.tsx) | Implementation guide: quick start commands, system architecture diagrams, test execution instructions, directory tree, proxy configuration details, and known model boundaries. |
| `*` | [`App.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/App.tsx) | Fallback wildcard redirect routing back to `/`. |
| Legacy (`/`) | [`templates/index.html`](file:///c:/Users/grant/Desktop/CN%20project/templates/index.html) | Monolithic Jinja2 template served by root [`app.py`](file:///c:/Users/grant/Desktop/CN%20project/app.py) containing single-page sections for Home, Simulator, Experiments, Theory, Exam, and Guide. |

---

## 2. Existing Controls & User Inputs

| Control Category | Location / Component | Specific Controls & Inputs | Valid Range / Behavior |
| :--- | :--- | :--- | :--- |
| **Simulation Configuration Inputs** | [`SimulationControls.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/SimulationControls.tsx) | • Number of Messages (`num_frames`)<br>• Data Travel Time (`data_travel_ms`)<br>• Receiver ACK Delay (`ack_delay_ms`)<br>• ACK Travel Time (`ack_travel_ms`)<br>• Sender Timeout (`timeout_ms`) | • 1 to 20 frames (integer)<br>• 1 to 5,000 ms (positive float)<br>• 0 to 10,000 ms (non-negative float)<br>• 1 to 5,000 ms (positive float)<br>• 1 to 20,000 ms (positive float) |
| **Preset Selectors** | [`SimulationControls.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/SimulationControls.tsx) | Quick Scenario dropdown: "Normal Delivery", "Delayed ACK", "Adjusted Timeout", or "Custom". | Loads pre-configured parameter bundles into state and alerts user if results are stale. |
| **Execution Triggers** | [`SimulationControls.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/SimulationControls.tsx) | • `▶ Calculate & Animate` (`#btn-run`)<br>• `↺ Reset` (`#btn-reset`) | • Validates inputs, sends POST request to `/api/simulate`, initiates playback.<br>• Resets configuration and clears results. |
| **Live Formula Preview** | [`SimulationControls.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/SimulationControls.tsx) | Real-time calculation: `ACK arrival = data travel + ACK delay + ACK travel`. | Dynamically compares sum against `timeout_ms` and alerts if retransmission is expected. |
| **Playback & Timeline Controls** | [`PlaybackControls.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/PlaybackControls.tsx) | • `⏸ Pause` / `▶ Resume` (`#btn-pause-resume`)<br>• `⏭ Next Event` (`#btn-next-event`)<br>• `🔄 Replay` (`#btn-replay`)<br>• `↺ Reset` (`#btn-reset-pb`)<br>• Speed Multipliers (`0.25×`, `0.5×`, `1×`, `2×`, `4×`)<br>• Millisecond Progress Display<br>• Playback Status Chip | • Freezes or resumes RAF animation loop.<br>• Advances simulation time directly to the next discrete event timestamp.<br>• Rewinds time to 0 ms and plays from start.<br>• Resets playback state to idle.<br>• Adjusts real-time to simulation-time scaling factor. |
| **Log Filtering & Scrolling** | [`EventLog.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/EventLog.tsx) | • Actor Filter dropdown (`All`, `SENDER`, `RECEIVER`)<br>• Auto-scroll toggle checkbox<br>• Collapsible header toggle (`▼` / `▶`) | Filters visible events by entity and controls automatic pinning to the newest event. |
| **Global Navigation** | [`AppNavigation.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/AppNavigation.tsx) | • Desktop navigation links<br>• Mobile hamburger toggle (`☰` / `✕`)<br>• Dynamic scroll-responsive blur navbar | Navigates across pages, collapses on route transition. |

---

## 3. Simulation Capabilities

Calculated strictly by the Python discrete-event engine in [`netvista-arq/backend/simulator/engine.py`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/backend/simulator/engine.py) (and root [`simulator.py`](file:///c:/Users/grant/Desktop/CN%20project/simulator.py)):

1. **Discrete-Event Priority Queue**:
   - Uses Python `heapq` with 4 priority levels to guarantee deterministic execution:
     - Priority 0: `ACK_ARRIVED` (highest priority; cancels timer at same instant)
     - Priority 1: `DATA_ARRIVED`
     - Priority 2: `ACK_SEND`
     - Priority 3: `TIMEOUT`
   - Sequence counter breaks ties within identical timestamp & priority buckets.
2. **Stop-and-Wait Flow Control**:
   - Strictly one unacknowledged data frame in flight at any given instant.
   - Alternating 1-bit sequence numbers (0 and 1).
   - Expected sequence numbers toggle upon receipt of valid in-order frames (`expected ^= 1`).
3. **Delayed ACK Dynamics**:
   - Receiver holds arrival for `ack_delay_ms` before generating and transmitting ACK.
   - Separate forward and backward propagation delays (`data_travel_ms` vs `ack_travel_ms`).
4. **Sender Timer & Retransmissions**:
   - Fresh timer token generated on every send/retransmission attempt.
   - Timer cancellation upon valid matching ACK arrival (`_active_token = -1`).
   - Stale timers silently ignored; expired active timers trigger retransmissions with incremented attempt numbers.
5. **Duplicate Detection & Suppression**:
   - Frames arriving with mismatched sequence numbers are flagged as duplicate (`accepted = False`).
   - Payloads are discarded and NOT delivered to the application layer.
   - Duplicate ACK is generated and returned to assist sender in clearing unacknowledged state.
6. **Stale ACK Handling**:
   - ACKs arriving after transfer completion or for previous sequence numbers are flagged as `ACK_IGNORED`.
7. **Comprehensive Event Trace & Animation Hints**:
   - Emits structured event logs with timestamps, actors, descriptions, and metadata.
   - Emits companion `animation_hints` specifically consumed by the frontend playback engine.

---

## 4. Animation Capabilities

1. **3D Workstation Scene** ([`NetworkScene.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/NetworkScene.tsx)):
   - Built with React Three Fiber (`@react-three/fiber`), Three.js (`three`), and `@react-three/drei`.
   - **Sender Node**:
     - 3D workstation model with interactive rotation and emissive point lights.
     - Dynamic color transitions: Cyan (`#22d3ee`) when active/waiting, Orange (`#fb923c`) during timeout/retransmission, Green (`#4ade80`) upon completion.
     - 3D labels for actor, current state (`state.state`), sequence number, and message ID.
   - **Receiver Node**:
     - 3D workstation model with reactive rotation and status lighting.
     - Color transitions: Green (`#4ade80`) for accepted frames, Orange (`#fb923c`) for duplicate discards.
     - 3D labels for expected sequence number and unique delivery counter.
   - **In-Flight Packets**:
     - Physical 3D packet geometry traversing the channel between nodes based on time interpolation (`progress = (currentTime - launchTime) / (arriveTime - launchTime)`).
     - Color coded: Blue (`#60a5fa`) for original DATA frames, Orange (`#fb923c`) for retransmissions, Green (`#4ade80`) for ACKs.
     - Synchronous 3D text billboards displaying packet labels (`DATA 0`, `DATA 0 — RETRY 1`, `ACK 0`).
   - **Channel Lanes & Environment**:
     - Visual upper lane (DATA forward path) and lower lane (ACK return path).
     - Volumetric fog, infinite grid floor, directional and ambient lighting.
     - Animated 3D `TimeoutRing` expanding from Sender during retransmission ticks.
   - **Camera Controls**:
     - Configured `OrbitControls` with vertical angle clamps and disabled panning for smooth navigation.
2. **Hero 3D Preview** ([`HomePage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/HomePage.tsx)):
   - Floating sender, receiver, and looped looping packet preview canvas.
3. **2D Sequence Diagram** ([`SequenceDiagram.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/SequenceDiagram.tsx)):
   - Interactive SVG timeline with vertical lifelines for SENDER and RECEIVER.
   - Scaled timeline rendering transmission arrows, return ACK arrows, dashed lines for ignored ACKs, and highlighted timeout nodes.

---

## 5. Exports

1. **Event Trace CSV Export** ([`SimulatorPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/SimulatorPage.tsx#L213) / [`EventLog.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/EventLog.tsx)):
   - Generates client-side downloadable file: `arq_events.csv`.
   - Schema: `time_ms,actor,event_type,message_id,sequence,attempt,description`.
2. **Experiment Comparison CSV Export** ([`ExperimentsPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/ExperimentsPage.tsx#L58)):
   - Generates client-side downloadable file: `arq_comparison.csv`.
   - Schema: `Scenario,ACK Delay (ms),Timeout (ms),Transmissions,Retransmissions,Duplicates,Delivered,Completion (ms)`.

---

## 6. Charts & Visual Data Presentation

1. **Retransmissions & Duplicates Comparison Bar Chart** ([`ExperimentsPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/ExperimentsPage.tsx#L158)):
   - Recharts `BarChart` comparing retransmission counts (orange) and duplicate frame counts (red) across experimental presets.
2. **Transfer Completion Time Bar Chart** ([`ExperimentsPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/ExperimentsPage.tsx#L173)):
   - Recharts `BarChart` plotting total completion time in milliseconds (cyan) across scenarios.
3. **Structured Metrics Counters Panel** ([`MetricsPanel.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/MetricsPanel.tsx)):
   - Live updated counter cards for: Transmissions, Retransmissions, Duplicates, Delivered, ACKs Sent, Completion Time.
   - Auto-generated explanatory summary paragraph explaining why retransmissions occurred or were prevented.
4. **Delivered Message Tray** ([`DeliveredTray.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/DeliveredTray.tsx)):
   - Visual feed of accepted messages delivered to the higher-layer application, with timestamps and sequence numbers.
   - Highlight box showing total discarded duplicate frames.

---

## 7. Theory and Examination Content

1. **Protocol Conceptual Modules** ([`TheoryPage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/TheoryPage.tsx)):
   - ARQ definition & error control philosophy.
   - Stop-and-Wait single unacknowledged frame operation.
   - Acknowledgement mechanism and numbering.
   - Sender timer configuration and expiration.
   - Retransmission mechanics.
   - Alternating sequence numbers ($0$ and $1$).
   - Duplicate suppression at the receiver.
   - Analytical timing equation: $T_{\text{ACK\_arrival}} = t_{\text{data}} + t_{\text{ack\_delay}} + t_{\text{ack\_travel}}$.
2. **Model Assumptions Explicit Listing**:
   - Zero packet loss, zero bit corruption, fixed propagation delays, no reordering, serialisation overhead excluded, tie-breaking preference for ACK over timeout.
3. **Exam-Style Worked Question**:
   - Question prompt: $t_{\text{data}} = 100\text{ms}, t_{\text{ack\_delay}} = 900\text{ms}, t_{\text{ack\_travel}} = 100\text{ms}, t_{\text{timeout}} = 600\text{ms}$.
   - 7-step detailed chronological solution from $t = 0\text{ms}$ to $t = 1,700\text{ms}$.
   - Summary statistics table.
   - Direct shortcut button to load and simulate this exact scenario.
4. **Practice Questions**:
   - Interactive `<details>` / `<summary>` accordions for self-testing.
   - Reference citations: Forouzan (5th ed.), Tanenbaum & Wetherall (5th ed.), Stallings (10th ed.).

---

## 8. Accessibility Features

1. **ARIA Attributes**:
   - `aria-label` on buttons: pause/resume toggle (`#btn-pause-resume`), replay, reset, mobile hamburger toggle, scenario preset select, actor filter.
   - `aria-describedby` linking numerical input fields to parameter explanation hints.
2. **Form Semantics**:
   - Standard HTML `<label>` elements tied to input `id`s (`htmlFor="cfg-..."`).
   - Visual error indicators and text hints (`error` class).
3. **Keyboard Usability**:
   - Interactive dropdowns, buttons, and text fields are keyboard focusable.
   - Details/summary accordions in Theory page support native keyboard expand/collapse.
4. **Semantic HTML5 Elements**:
   - Proper hierarchy with `<nav>`, `<main>`, `<section>`, `<aside>`, `<h1>`, `<h2>`, `<h3>`, `<footer>`.

---

## 9. Known Baseline Problems & Limitations

1. **Missing Root Static CSS**:
   - Root [`templates/index.html`](file:///c:/Users/grant/Desktop/CN%20project/templates/index.html) references `/static/css/style.css`, but the `static/` directory does not exist in the root folder, causing 404 errors and unstyled rendering when serving root `app.py`.
2. **React Compiler / Oxlint Lint Warnings**:
   - `GuidePage.tsx:3`: `CodeBlock` component is defined *inside* the render function of `GuidePage`, triggering React hooks static-components warnings and causing remounts on every render.
   - `AppNavigation.tsx:24`: Synchronous `setState` inside `useEffect` on route change.
   - `SimulatorPage.tsx:68`: Synchronous `setState` inside `useEffect` during playback time ticks rather than deriving state directly.
   - `ExperimentsPage.tsx:38`: `Date.now()` flagged by purity linter in handler scope.
3. **Interactive Timeline Scrubber Missing**:
   - The playback bar in [`PlaybackControls.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/PlaybackControls.tsx) is purely a display bar (`<div>`), not an interactive draggable slider (`<input type="range">`), preventing users from scrubbing freely through time.
4. **WebGL 2D Fallback Inside Simulator Canvas**:
   - When running on devices without WebGL support or GPU acceleration, there is currently no toggle to switch the primary simulation viewport from 3D to an animated 2D canvas view.
5. **Sequence Diagram Key Deletion During Render**:
   - In [`SequenceDiagram.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/components/SequenceDiagram.tsx#L72), `sentAck.delete(key)` mutates a local Map during component render, and packets in flight are not dynamically indicated along the vertical lifeline.
6. **Documentation Port Discrepancy**:
   - [`GuidePage.tsx`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/src/pages/GuidePage.tsx#L40) specifies `http://localhost:5173`, but [`vite.config.ts`](file:///c:/Users/grant/Desktop/CN%20project/netvista-arq/frontend/vite.config.ts#L7) binds to port `3000`.
7. **Production Bundle Chunk Size**:
   - Single production JS bundle reaches 1,574 kB because Three.js, React Three Fiber, and Recharts are not code-split.
8. **Backend Root 404 & Port Separation**:
   - Direct requests to `http://localhost:5000/` return a 404 error because `backend/app.py` only defines `/api/*` endpoints (the frontend UI is hosted on port 3000). A root response/redirect is needed to guide users.

---

## 10. Relevant File Locations

```
c:/Users/grant/Desktop/CN project/
├── app.py                                    # Legacy root Flask server
├── simulator.py                              # Legacy root simulation engine
├── requirements.txt                          # Legacy root Python dependencies
├── templates/
│   └── index.html                            # Legacy single-page UI template
├── tests/
│   └── test_simulator.py                     # Legacy simulator unit tests (6 tests)
└── netvista-arq/
    ├── backend/
    │   ├── app.py                            # Modern Flask REST API
    │   ├── requirements.txt                  # Modern backend dependencies
    │   ├── simulator/
    │   │   ├── __init__.py                   # Package exports
    │   │   ├── engine.py                     # Discrete-event min-heap engine
    │   │   ├── models.py                     # Data models, Enums, Result schema
    │   │   └── validation.py                 # Input range and type validation
    │   └── tests/
    │       ├── test_engine.py                # Engine pytest test suite (34 tests)
    │       └── test_edge_cases.py            # Comprehensive edge case tests (38 tests)
    ├── frontend/
    │   ├── index.html                        # Vite HTML entrypoint
    │   ├── vite.config.ts                    # Vite dev server & proxy configuration (port 3000)
    │   ├── package.json                      # React, Three.js, Recharts dependencies
    │   ├── tsconfig.json                     # TypeScript configuration
    │   ├── src/
    │   │   ├── App.tsx                       # Root routing & layout
    │   │   ├── main.tsx                      # DOM entrypoint
    │   │   ├── index.css                     # Global utility styles
    │   │   ├── pages/
    │   │   │   ├── HomePage.tsx              # Home / Landing page
    │   │   │   ├── SimulatorPage.tsx         # Interactive ARQ simulator
    │   │   │   ├── ExperimentsPage.tsx       # Presets & comparison graphs
    │   │   │   ├── TheoryPage.tsx            # Protocol theory & exam worked example
    │   │   │   └── GuidePage.tsx             # Setup guide & architecture documentation
    │   │   ├── components/
    │   │   │   ├── AppNavigation.tsx         # Top navigation bar
    │   │   │   ├── NetworkScene.tsx          # 3D React Three Fiber workstation scene
    │   │   │   ├── PlaybackControls.tsx      # Time & playback toolbar
    │   │   │   ├── SimulationControls.tsx    # Parameter configuration aside
    │   │   │   ├── StateCards.tsx            # Sender & Receiver live cards
    │   │   │   ├── MetricsPanel.tsx          # Summary metric cards & explanation
    │   │   │   ├── DeliveredTray.tsx         # Delivered payloads & duplicate discard tracker
    │   │   │   ├── SequenceDiagram.tsx       # 2D SVG sequence ladder diagram
    │   │   │   └── EventLog.tsx              # Event log with filter and CSV export
    │   │   ├── simulation/
    │   │   │   └── playback.ts               # Pure state derivation from event traces
    │   │   ├── services/
    │   │   │   └── api.ts                    # Axios API client
    │   │   └── types/
    │   │       └── simulation.ts             # TypeScript definitions
    │   └── dist/                             # Compiled production bundle
    ├── docs/                                 # Documentation directory
    └── examples/                             # Preset examples directory


---
## Post-audit enhancement inventory (13 October 2026)
All original file paths and primary modern features above are retained. See the AUDIT_REPORT.md addendum for executed verification and limitations.

Added: timeline seeking; reset-camera control; next-ACK countdown; reduced-motion/start-paused mode; 2D companion and rendering fallback; custom-run persistence/comparisons; run JSON export; print styling; runtime API validation; cancelled/stale request protection; production Flask SPA hosting; launch script; 53 new backend tests (including the 100-configuration invariant sweep), 26 frontend tests; evidence files and submission drafts.

Improved: route chunking, readable 3D labels without remote fonts, mobile layouts/navigation, event pairing and logs, CSV escaping/settings, actual-runs-only charts, documentation and exam wording.

Clarification: Stop-and-Wait permits one outstanding NEW logical message, not necessarily one physical packet copy in the channel. Multiple retransmissions/ACKs may overlap. Travel times are positive; receiver ACK delay may be zero.

Primary launch: netvista-arq/backend/app.py -> http://127.0.0.1:5000 (built React + Python). Development frontend remains http://localhost:3000. Legacy prototype remains historical source; its JavaScript assets were absent at baseline.


## Extended timing and packet inspection — 13 October 2026
- All four timing inputs now accept up to 3,600,000 ms; 600,000 ms and values above it are supported. Event-count protection remains active for excessive retries.
- Added 10x, 100x and 1000x playback.
- Enhanced 3D stations, direction arrows, packet message labels and arrival countdowns; redesigned 2D lanes with sequence labels, timer and pending ACK counts.
- Added packet inspector beneath playback with sender/receiver columns, message, sequence, attempt, send/arrival timestamps, travel/elapsed duration, playback-aware delivery outcome, DATA/ACK filtering and CSV export.
- Validation: 128 backend tests and 32 frontend tests passed; production build and lint passed. Browser verified a 600,000 ms ACK delay, initial scheduled rows, first arrival at 100 ms, completion, ACK filter and both scene modes. Existing bundle-size warning remains.
