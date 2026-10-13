# NetVista ARQ - React + Python networking lab

Student ID: 25CS096. The modern application lives in this folder. The parent-folder Flask prototype is retained as historical source; use the modern app for your submission.

## Quick start (already built)
From this folder run:

```powershell
python -m pip install -r backend/requirements.txt
python backend/app.py
```

Open http://127.0.0.1:5000. Flask serves both the built React website and the Python API. No public hosting is required. You may also double-click START_LAB.cmd in the parent folder. Keep the server terminal open; Ctrl+C stops it.

## Development
Requires Python 3.12+ and Node.js 24+ (Node 24 is used for the TypeScript tests).

Terminal 1:
```powershell
cd backend
python app.py
```

Terminal 2:
```powershell
cd frontend
npm ci
npm run dev
```

Open http://localhost:3000. Vite proxies /api to port 5000. Run `npm run build` after frontend edits to refresh the production website on port 5000. Ports 3000 and 5000 must be available; do not run the legacy and modern backends on the same port.

## Verification
Run suites separately because the historical and modern engines share the module name simulator.

```powershell
cd backend
python -m pytest -q
cd ../frontend
npm test
npm run lint
npm run build
```

## Demonstration
1. Open Simulator, choose Delayed ACK, and enable Reduced motion / start paused.
2. Calculate, then use Next Event: 100 ms accepts data, 600 ms retransmits, 700 ms discards the duplicate.
3. At 1100 ms transfer completes; a trailing ACK reaches the sender at 1700 ms and is ignored.
4. Compare with Normal Delivery and Adjusted Timeout.
5. Use the timeline to seek backward, Replay for another playback, or Resume for movement. Speed changes display time only.
6. Download JSON and CSV. Save custom runs for the Experiments page; browser storage retains up to 30 runs.
7. Show 2D provides an accessible companion view without removing the 3D scene. Reset Camera restores the default angle.

## Model
A deterministic Python event heap produces the entire trace before animation. React uses a shared playback clock to derive visible state. One new message is outstanding at a time, although multiple retransmitted copies or ACKs can be in flight. ACK n acknowledges DATA n. Receiver duplicate decisions use the alternating sequence bit, not a hidden message identifier.

Fixed positive data/ACK travel times, nonnegative receiver ACK delay, no loss/corruption/reordering, no separate serialization or processing time. Every received data copy schedules an ACK. ACK arrival wins ties with timeout. Stale timer tokens are ignored. Settings accept up to 20 messages, 30000 ms travel/ACK delay, and 60000 ms timeout. A 5000 internal-event cap returns a helpful error instead of an unbounded trace. Zero travel time is intentionally rejected; zero receiver ACK delay is supported.

Transfer completion is when the final required ACK is accepted. All-events finish can be later due to duplicate-triggered ACKs. Final results are labelled separately from live playback counters.

## Files for submission
- Editable frontend and backend source plus dependencies and tests.
- examples/results: actual exported experiment evidence.
- docs/report.md: editable technical report draft.
- docs/presentation-outline.md and recording-guide.md.
- docs/submission-checklist.md.
- AUDIT_REPORT.md in the parent folder: executed checks and limitations.

Review and personalise the drafts. Record your own narration and acknowledge AI assistance according to institutional policy. No video has been recorded or uploaded by this project.


## Extended timing and packet inspection — 13 October 2026
- All four timing inputs now accept up to 3,600,000 ms; 600,000 ms and values above it are supported. Event-count protection remains active for excessive retries.
- Added 10x, 100x and 1000x playback.
- Enhanced 3D stations, direction arrows, packet message labels and arrival countdowns; redesigned 2D lanes with sequence labels, timer and pending ACK counts.
- Added packet inspector beneath playback with sender/receiver columns, message, sequence, attempt, send/arrival timestamps, travel/elapsed duration, playback-aware delivery outcome, DATA/ACK filtering and CSV export.
- Validation: 128 backend tests and 32 frontend tests passed; production build and lint passed. Browser verified a 600,000 ms ACK delay, initial scheduled rows, first arrival at 100 ms, completion, ACK filter and both scene modes. Existing bundle-size warning remains.
