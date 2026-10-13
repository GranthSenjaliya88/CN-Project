# Stop-and-Wait ARQ with Delayed ACK
Student ID: 25CS096. Name/class: complete before submission.

## Objective
Implement and visualise Stop-and-Wait ARQ using a Python event engine and React 3D interface. Investigate how receiver ACK delay and sender timeout affect retransmissions and duplicate delivery.

## Essential theory
The sender has one outstanding new message and waits for its ACK. Timeout resends the same payload and alternating sequence bit. The receiver accepts the expected bit, delivers once, toggles its expectation, and discards duplicate payloads. ACK 0 acknowledges DATA 0; ACK 1 acknowledges DATA 1.

## Methodology and implementation
A Python priority queue schedules data arrival, ACK sending, ACK arrival, and timeout. Timer generation tokens invalidate obsolete timeouts. Flask returns a JSON trace. React replays the trace; packet positions, live states and counters follow the same simulation clock. Three.js renders workstations and packets; an SVG view and event log provide alternative explanations. Input validation and a bounded event queue protect invalid or expensive runs.

All reference experiments use one message, 100 ms data travel and 100 ms ACK return travel. Only ACK delay and timeout change. Results below were calculated by the executable model and verified in the browser. Exported files are in examples/results.

| Run | ACK delay (ms) | Timeout (ms) | Transmissions | Retransmissions | Duplicates | Delivered | Completion (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
| Normal |100|800|1|0|0|1|300|
| Delayed ACK |900|600|2|1|1|1|1100|
| Adjusted timeout |900|1400|1|0|0|1|1100|

## Observations and interpretation
The delayed ACK reaches the sender after its timeout, so one additional copy is sent. The receiver still delivers only one unique message. Increasing the timeout prevents this redundant transmission, but completion remains 1100 ms because the ACK itself has not become faster. An overly large timeout could delay loss recovery; loss is outside this experiment.

## Worked university-style question
Given data travel 100 ms, receiver ACK delay 900 ms, ACK return 100 ms, and timeout 600 ms, determine the first ACK arrival and explain retransmission.

ACK waiting time = 100 + 900 + 100 = 1100 ms. DATA 0 arrives at 100 ms and is accepted. At 600 ms the sender retransmits DATA 0; this copy arrives at 700 ms and is discarded as a duplicate. The original ACK is sent at 1000 ms and accepted at 1100 ms. The duplicate-triggered ACK is sent at 1600 ms and ignored at 1700 ms because transfer is complete. Exactly one payload is delivered.

## Limitations
Fixed FIFO delays, no loss/corruption/reordering, no separate serialization time, no real socket traffic. Positive travel times are required. Extreme inputs may exceed the event cap. Playback speed affects presentation only. The model is Stop-and-Wait ARQ, not TCP.

## Reproduction
Follow README.md, select each preset, Calculate & Animate, inspect the log, and export results. Use Reduced motion to start paused and Next Event to explain the chronology. Backend tests and frontend playback tests verify timing and invariants.

## Conclusion
A delayed ACK can cause unnecessary retransmission even though data arrived successfully. Alternating sequence numbers suppress duplicate payload delivery. Choosing a timeout appropriate to the expected round trip avoids premature retries under the stated model.

## Evidence to attach
Use the actual CSV/JSON files and capture the 600 ms timeout, 700 ms duplicate, and completed comparison table. Review any saved screenshots for readability before inclusion.

## References and acknowledgement
Verified open reference: [Peter L. Dordal, An Introduction to Computer Networks, section 8.1](https://intronetworks.cs.luc.edu/current2/html/slidingwindows.html#building-reliable-transport-stop-and-wait), consulted 13 October 2026. It explains Stop-and-Wait retransmission, sequence numbering and delayed ACKs. The Theory page also retains the original suggested textbook readings (Forouzan; Tanenbaum and Wetherall; Stallings). Check the editions against the books you actually consult before submitting. The measurements in this report come from this project's executable engine.

AI assistance declaration: edit to accurately describe assistance with code, debugging, testing and draft preparation. Verify and explain the implementation yourself. Do not sign an authorship declaration without reviewing it.
