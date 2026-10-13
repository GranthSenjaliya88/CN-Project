# Protocol Lab — 14 October 2026

Open http://127.0.0.1:5000/protocol-lab. The assigned Stop-and-Wait delayed-ACK simulator remains at /simulator.

## Reproducible comparison
Use 6 messages, window 4 (SW forces 1), DATA and ACK travel 600 ms, ACK delay 200 ms, timeout 2000 ms. Lose DATA frame 2 once. Calculate, step/play, then add to comparison. Go-Back-N retries 4 frames; Selective Repeat retries only frame 2. Both deliver frames 1 through 6 once, in order. JSON traces are in examples/results/lab-*-data-loss.json.

For ACK loss, use Stop-and-Wait, no DATA loss and lose ACK 1 once. Expect one retransmission and one duplicate suppressed.

## Model
Python uses an ordered event queue; ACK arrival wins timeout ties. GBN has cumulative ACKs, an oldest-outstanding-frame timer and discards out-of-order frames. SR has per-frame timers and buffers out-of-order frames. SW has one outstanding frame and alternating bits. GBN/SR use absolute sequence IDs in this finite trace, without wrapping. Fixed equal DATA/ACK travel times; no jitter, corruption or reordering. Window frames launch at the same simulated timestamp, so serialization and physical bandwidth are not modelled. Selected loss occurs once on the first matching transmission. The red midpoint marker illustrates loss; packets are not literal objects moving through a wire. Event budget protects pathological timeout settings.

## Visual controls
Drag to orbit, wheel to zoom, or choose Overview / Follow packet. Reset Camera restores the selected view. DATA is blue, ACK green, retry orange, selected loss red. Loss disappears halfway through travel; the sender still waits for its timer. 2D is available as an alternative and WebGL fallback. The home demo uses a computed Python trace with a looping clock and a pause control.

## Evidence
158 Python tests and 32 frontend tests passed. Production build and lint passed. Browser checks verified GBN DATA loss, SR selective recovery, SW ACK loss, no stale-settings warning after calculating, 2D loss view, camera follow and no application console errors. Geometry is procedural and uses no downloaded model assets. Reflective rendering adds GPU cost; performance on low-end hardware has not been benchmarked. The existing build warning for the large 3D bundle remains.

Comparison results are kept only during the current page visit; export JSON/CSV for persistent evidence.
