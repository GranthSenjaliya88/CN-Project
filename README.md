# NetVista ARQ

React 3D/2D visualisation backed by a Python discrete-event Stop-and-Wait ARQ simulator with delayed acknowledgments.

The current application is in **netvista-arq/**. See [setup and documentation](netvista-arq/README.md). On Windows, install the backend requirements and run `START_LAB.cmd`, then open http://127.0.0.1:5000/simulator.

**[Live demo](https://netvista-arq.onrender.com)** · **[Simulator](https://netvista-arq.onrender.com/simulator)** · **[Guide](https://netvista-arq.onrender.com/guide)**

## Features

- Detailed 3D workstations, moving packets, orbit/zoom/follow camera controls and a 2D companion view.
- Custom DATA travel time, receiver ACK delay, ACK travel time and sender timeout.
- Alternating sequence bits, retransmissions, duplicate suppression and timeout countdowns.
- Pause, replay, next-event stepping, timeline seeking and playback speeds up to 1000×.
- Packet inspector, event logs, CSV/JSON exports and saved-run comparisons.
- Three reference experiments and worked theory explanations.

## Architecture

```text
React configuration → Flask API → validation → Python event queue
                                            ↓
3D/2D scene ← playback clock ← JSON trace and final metrics
```

Python calculates the complete event trace before playback. React derives visible states and counters from simulation time. Playback speed changes presentation speed, not protocol timings.

| Layer | Stack |
| --- | --- |
| Interface | React 18, TypeScript, Vite |
| Visualization | Three.js, React Three Fiber, Drei, Recharts |
| Backend | Python 3.12, Flask |
| Deployment | Docker, Gunicorn, Render |

## Local setup

```bash
git clone https://github.com/GranthSenjaliya88/CN-Project.git
cd CN-Project/netvista-arq
python -m pip install -r backend/requirements.txt
python backend/app.py
```

Open http://127.0.0.1:5000. The committed frontend build runs without Node.js.

For frontend development, use Node.js 24+ and a second terminal:

```bash
cd CN-Project/netvista-arq/frontend
npm ci
npm run dev
```

Vite runs on port 3000 and proxies `/api` to Flask on port 5000. Run `npm run build` after frontend edits to refresh the version Flask serves.

## Reference experiments

All presets use one message and 100 ms each for DATA and ACK travel.

| Scenario | ACK delay | Timeout | First ACK arrival | Retries | Duplicates |
| --- | ---: | ---: | ---: | ---: | ---: |
| Normal delivery | 100 ms | 800 ms | 300 ms | 0 | 0 |
| Delayed ACK | 900 ms | 600 ms | 1100 ms | 1 | 1 |
| Adjusted timeout | 900 ms | 1400 ms | 1100 ms | 0 | 0 |

Each delivers the payload once. **ACK return duration = DATA travel + receiver ACK delay + ACK travel.** Receiver waiting time is separate from ACK travel time.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Service health |
| GET | `/api/scenarios` | Presets and expected results |
| POST | `/api/simulate` | Calculate a simulation trace |

```json
{"num_frames":1,"data_travel_ms":100,"ack_delay_ms":900,"ack_travel_ms":100,"timeout_ms":600}
```

## Source layout

```text
netvista-arq/
  backend/app.py       # API and frontend serving
  backend/simulator/  # Engine, models and validation
  backend/tests/
  frontend/src/       # Pages, scenes, playback and API client
  frontend/tests/
  frontend/dist/      # Production build
  docs/               # Technical and presentation material
  examples/results/   # Experiment evidence
Dockerfile
render.yaml
START_LAB.cmd
```

Root Flask files are a preserved legacy prototype. Use the application in `netvista-arq/`; do not run both backends on the same port.

## Verification

From `netvista-arq/backend`, run `python -m pytest tests -q`. Running there avoids importing the legacy root simulator.

From `netvista-arq/frontend`:

```bash
npm test
npm run lint
npm run build
```

The suites contain 128 backend and 32 frontend tests covering protocol events, validation, duplicate suppression, playback and exports. The build currently reports a size warning for the 3D bundle.

## Model boundaries

- Only Stop-and-Wait ARQ with delayed ACK is implemented.
- One new message is outstanding at a time; retransmitted copies and ACKs may overlap in flight.
- Alternating sequence bits 0 and 1; ACK n acknowledges DATA n.
- Fixed travel times, without loss, corruption, reordering, jitter or separate serialization delay.
- Every received DATA copy schedules an ACK. ACK arrival wins equal-time ties with timeout.
- Up to 20 messages and 3,600,000 ms per timing input; an event budget limits excessive retries.
- Educational simulation, not physical network traffic. The 3D view requires WebGL.

## Deployment and documentation

Docker builds React with Node 22 and serves it with Python 3.12 and Gunicorn. Render checks `/api/health`. Free hosting can take time to wake after inactivity; public-repository deployments may require Manual Deploy.

- [Render deployment](netvista-arq/docs/render-deployment.md)
- [Technical report](netvista-arq/docs/report.md)
- [Presentation outline](netvista-arq/docs/presentation-outline.md)
- [Recording guide](netvista-arq/docs/recording-guide.md)

Keep the Python trace as the source of truth when making changes, and verify the three reference experiments before changing expected results.
