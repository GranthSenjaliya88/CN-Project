"""
simulator/engine.py
Pure discrete-event Stop-and-Wait ARQ simulation engine.

Design decisions
────────────────
* A min-heap priority queue drives the simulation.
* Each event entry is (time_ms, priority, sequence_counter, payload).
  - priority:  0=ACK_ARRIVED  1=DATA_ARRIVED  2=ACK_SEND  3=TIMEOUT
  - sequence_counter breaks ties deterministically within the same
    (time_ms, priority) bucket so heapq never compares dicts.
* Timer generations: each new send attempt increments a global timer
  token. Timeout events carry their token; stale tokens are ignored.
* Tie-breaking rule (documented): when ACK_ARRIVED and TIMEOUT share
  the same simulation time, ACK_ARRIVED is processed first (lower
  priority integer = processed first).
* Max event count: if the simulation would produce more than MAX_EVENTS
  internal steps it stops with an error to protect the browser.
"""

from __future__ import annotations

import heapq
from typing import Any, Dict, List, Optional, Tuple

from .models import (
    AnimationHint,
    EventType,
    SimConfig,
    SimEvent,
    SimMetrics,
    SimResult,
)

MAX_EVENTS = 5_000  # hard cap on internal heap operations

MODEL_ASSUMPTIONS = [
    "Deterministic discrete-event model with a priority queue.",
    "One sender and one receiver; one outstanding new data frame at a time.",
    "Fixed data and ACK travel times for the duration of each run.",
    "No packet loss, corruption, or reordering.",
    "Serialisation and additional processing time are not separately modelled.",
    "The receiver can receive frames while ACKs are still pending.",
    "Every received data copy (original or duplicate) schedules an ACK after the configured ACK delay.",
    "ACK 0 acknowledges DATA 0; ACK 1 acknowledges DATA 1.",
    "Tie-breaking: when ACK_ARRIVED and TIMEOUT share the same simulation time, "
    "ACK_ARRIVED is processed first, cancelling the timeout.",
]

# Priority constants (lower = processed first at the same simulation time)
_P_ACK_ARRIVED  = 0
_P_DATA_ARRIVED = 1
_P_ACK_SEND     = 2
_P_TIMEOUT      = 3


class _Engine:
    def __init__(self, cfg: SimConfig) -> None:
        self.cfg = cfg
        self.heap: List[Tuple[float, int, int, Dict[str, Any]]] = []
        self._seq_ctr = 0           # heap insertion order for determinism

        # Protocol state
        self.sender_current_msg: int   = 1      # 1-indexed
        self.sender_seq:         int   = 0      # alternating 0 / 1
        self.sender_attempt:     int   = 0
        self.receiver_exp_seq:   int   = 0

        # Timer token: incremented on every new send; stale tokens ignored
        self._timer_token:        int  = 0
        self._active_token:       int  = -1

        # Results
        self.events:            List[SimEvent]        = []
        self.anim_hints:        List[AnimationHint]   = []
        self.delivered:         List[Dict[str, Any]]  = []
        self.metrics            = SimMetrics()
        self.metrics.unique_messages_requested = cfg.num_frames

        self._step_count = 0

    # ──────────────────── heap helpers ────────────────────

    def _push(self, time_ms: float, priority: int, payload: Dict[str, Any]) -> None:
        self._seq_ctr += 1
        heapq.heappush(self.heap, (time_ms, priority, self._seq_ctr, payload))

    def _pop(self) -> Tuple[float, Dict[str, Any]]:
        t, _p, _s, payload = heapq.heappop(self.heap)
        return t, payload

    # ──────────────────── logging ────────────────────

    def _log(
        self,
        time_ms:   float,
        etype:     EventType,
        actor:     str,
        desc:      str,
        msg_id:    Optional[int] = None,
        seq:       Optional[int] = None,
        attempt:   Optional[int] = None,
        is_retx:   bool          = False,
        extra:     Optional[Dict[str, Any]] = None,
    ) -> SimEvent:
        ev = SimEvent(
            time_ms=time_ms,
            event_type=etype,
            actor=actor,
            message_id=msg_id,
            sequence=seq,
            attempt=attempt,
            is_retransmission=is_retx,
            description=desc,
            extra=extra or {},
        )
        self.events.append(ev)
        return ev

    def _anim(self, time_ms: float, anim_type: str, **kwargs: Any) -> None:
        self.anim_hints.append(AnimationHint(time_ms=time_ms, anim_type=anim_type, extra=kwargs))

    # ──────────────────── transmit ────────────────────

    def _transmit(self, time_ms: float, msg_id: int, seq: int, attempt: int, is_retx: bool) -> None:
        cfg = self.cfg
        self.metrics.total_data_transmissions += 1
        if is_retx:
            self.metrics.retransmissions += 1

        label = "retransmitting" if is_retx else "transmitting"
        retry_label = f" — RETRY {attempt - 1}" if is_retx else ""
        pkt_label = f"DATA {seq}{retry_label}"

        self._log(
            time_ms, EventType.DATA_SENT, "SENDER",
            f"Sender {label} Message {msg_id} (seq={seq}, attempt={attempt})",
            msg_id=msg_id, seq=seq, attempt=attempt, is_retx=is_retx,
            extra={"packet_label": pkt_label, "arrive_at": time_ms + cfg.data_travel_ms},
        )
        self._anim(
            time_ms, "packet_launch",
            direction="data", msg_id=msg_id, seq=seq, attempt=attempt,
            is_retransmission=is_retx, arrive_at=time_ms + cfg.data_travel_ms,
            packet_label=pkt_label,
        )

        # DATA arrives at receiver
        self._push(time_ms + cfg.data_travel_ms, _P_DATA_ARRIVED, {
            "etype": "DATA_ARRIVED",
            "msg_id": msg_id, "seq": seq, "attempt": attempt, "is_retx": is_retx,
        })

        # Fresh timer
        self._timer_token += 1
        tok = self._timer_token
        self._active_token = tok
        self.sender_attempt = attempt

        self._push(time_ms + cfg.timeout_ms, _P_TIMEOUT, {
            "etype": "TIMEOUT",
            "msg_id": msg_id, "seq": seq, "attempt": attempt, "token": tok,
        })

    # ──────────────────── main run ────────────────────

    def run(self) -> None:
        # Kick off with message 1 at t=0
        self._transmit(0.0, 1, 0, 1, False)

        while self.heap:
            self._step_count += 1
            if self._step_count > MAX_EVENTS:
                # Surface error; partial results already recorded
                raise RuntimeError(
                    f"Simulation exceeded {MAX_EVENTS} internal steps. "
                    "Try smaller frame counts or longer timeouts."
                )

            t, d = self._pop()
            etype = d["etype"]

            if etype == "DATA_ARRIVED":
                self._handle_data_arrived(t, d)
            elif etype == "ACK_SEND":
                self._handle_ack_send(t, d)
            elif etype == "ACK_ARRIVED":
                self._handle_ack_arrived(t, d)
            elif etype == "TIMEOUT":
                self._handle_timeout(t, d)

        # Record overall finish time
        if self.events:
            self.metrics.all_events_finish_ms = max(e.time_ms for e in self.events)

    # ──────────────────── event handlers ────────────────────

    def _handle_data_arrived(self, t: float, d: Dict[str, Any]) -> None:
        cfg = self.cfg
        msg_id = d["msg_id"]
        seq    = d["seq"]
        attempt = d["attempt"]
        is_retx = d["is_retx"]

        if seq == self.receiver_exp_seq:
            # ── New frame ──
            self.receiver_exp_seq ^= 1  # toggle expected sequence
            self.delivered.append({"message_id": msg_id, "seq": seq, "time_ms": t})
            self.metrics.unique_messages_delivered += 1

            self._log(
                t, EventType.DATA_ARRIVED, "RECEIVER",
                f"Receiver accepted Message {msg_id} (seq={seq}); payload delivered.",
                msg_id=msg_id, seq=seq, attempt=attempt, is_retx=is_retx,
                extra={"accepted": True, "duplicate": False,
                       "new_expected_seq": self.receiver_exp_seq},
            )
            self._log(
                t, EventType.PAYLOAD_DELIVERED, "RECEIVER",
                f"Payload of Message {msg_id} delivered to application.",
                msg_id=msg_id, seq=seq,
            )
            self._anim(t, "payload_delivered", msg_id=msg_id, seq=seq)

            ack_send_t = t + cfg.ack_delay_ms
            self._log(
                t, EventType.ACK_SCHEDULED, "RECEIVER",
                f"ACK {seq} scheduled to be sent at {ack_send_t:.0f} ms.",
                seq=seq, msg_id=msg_id,
                extra={"ack_send_time": ack_send_t, "for_duplicate": False},
            )
            self._push(ack_send_t, _P_ACK_SEND, {
                "etype": "ACK_SEND", "seq": seq, "msg_id": msg_id, "for_duplicate": False,
            })
        else:
            # ── Duplicate frame ──
            self.metrics.duplicate_data_arrivals += 1

            self._log(
                t, EventType.DATA_ARRIVED, "RECEIVER",
                f"Receiver received duplicate (seq={seq}); payload discarded.",
                msg_id=msg_id, seq=seq, attempt=attempt, is_retx=is_retx,
                extra={"accepted": False, "duplicate": True,
                       "new_expected_seq": self.receiver_exp_seq},
            )
            self._log(
                t, EventType.DUPLICATE_DISCARDED, "RECEIVER",
                f"Duplicate Message {msg_id} (seq={seq}) discarded — not delivered again.",
                msg_id=msg_id, seq=seq,
            )
            self._anim(t, "duplicate_flash", msg_id=msg_id, seq=seq)

            ack_send_t = t + cfg.ack_delay_ms
            self._log(
                t, EventType.ACK_SCHEDULED, "RECEIVER",
                f"ACK {seq} (for duplicate) scheduled at {ack_send_t:.0f} ms.",
                seq=seq, msg_id=msg_id,
                extra={"ack_send_time": ack_send_t, "for_duplicate": True},
            )
            self._push(ack_send_t, _P_ACK_SEND, {
                "etype": "ACK_SEND", "seq": seq, "msg_id": msg_id, "for_duplicate": True,
            })

    def _handle_ack_send(self, t: float, d: Dict[str, Any]) -> None:
        cfg = self.cfg
        seq        = d["seq"]
        msg_id     = d["msg_id"]
        for_dup    = d.get("for_duplicate", False)
        self.metrics.acks_sent += 1

        dup_label = " (duplicate ACK)" if for_dup else ""
        self._log(
            t, EventType.ACK_SENT, "RECEIVER",
            f"Receiver sent ACK {seq}{dup_label}.",
            seq=seq, msg_id=msg_id,
            extra={"for_duplicate": for_dup, "arrive_at": t + cfg.ack_travel_ms},
        )
        self._anim(
            t, "packet_launch",
            direction="ack", seq=seq, msg_id=msg_id,
            for_duplicate=for_dup, arrive_at=t + cfg.ack_travel_ms,
            packet_label=f"ACK {seq}",
        )
        self._push(t + cfg.ack_travel_ms, _P_ACK_ARRIVED, {
            "etype": "ACK_ARRIVED",
            "seq": seq, "msg_id": msg_id, "for_duplicate": for_dup,
        })

    def _handle_ack_arrived(self, t: float, d: Dict[str, Any]) -> None:
        seq     = d["seq"]
        msg_id  = d["msg_id"]
        for_dup = d.get("for_duplicate", False)

        # Is this the ACK we are currently waiting for?
        waiting_for_seq = self.sender_seq
        transfer_done   = self.metrics.transfer_complete_time_ms is not None

        if not transfer_done and seq == waiting_for_seq:
            # Valid ACK — cancel timer
            self._active_token = -1  # invalidate outstanding timer
            self.metrics.acks_accepted += 1

            self._log(
                t, EventType.ACK_ARRIVED, "SENDER",
                f"Sender received ACK {seq} for Message {msg_id}.",
                seq=seq, msg_id=msg_id,
                extra={"accepted": True, "for_duplicate": for_dup},
            )
            self._log(
                t, EventType.ACK_ACCEPTED, "SENDER",
                f"ACK {seq} accepted; timer cancelled.",
                seq=seq, msg_id=msg_id,
            )
            self._anim(t, "ack_received", seq=seq, msg_id=msg_id, accepted=True)

            # Advance sender — compute next seq BEFORE toggling stored state
            next_msg = self.sender_current_msg + 1
            next_seq = self.sender_seq ^ 1  # what seq the next message will use
            self.sender_current_msg = next_msg
            self.sender_seq         = next_seq

            if self.sender_current_msg <= self.cfg.num_frames:
                # Not done yet — send next frame; transfer_complete_time remains None
                self._transmit(t, self.sender_current_msg, self.sender_seq, 1, False)
            else:
                # All frames acknowledged
                self.metrics.transfer_complete_time_ms = t
                self._log(
                    t, EventType.TRANSFER_COMPLETE, "SENDER",
                    "All messages acknowledged. Transfer complete.",
                    extra={"transfer_complete_time_ms": t},
                )
                self._anim(t, "transfer_complete", complete_at=t)
        else:
            # Stale or unexpected ACK
            self.metrics.acks_ignored += 1
            reason = (
                "transfer already complete" if transfer_done
                else f"expected ACK {waiting_for_seq}"
            )
            self._log(
                t, EventType.ACK_ARRIVED, "SENDER",
                f"Sender received stale ACK {seq} ({reason}); ignored.",
                seq=seq, msg_id=msg_id,
                extra={"accepted": False, "stale": True, "for_duplicate": for_dup},
            )
            self._log(
                t, EventType.ACK_IGNORED, "SENDER",
                f"ACK {seq} ignored ({reason}).",
                seq=seq,
            )
            self._anim(t, "ack_received", seq=seq, msg_id=msg_id, accepted=False, stale=True)

    def _handle_timeout(self, t: float, d: Dict[str, Any]) -> None:
        token  = d["token"]
        if token != self._active_token:
            # Stale timer — silently discard
            return

        msg_id  = d["msg_id"]
        seq     = d["seq"]
        attempt = d["attempt"]

        self._log(
            t, EventType.TIMEOUT, "SENDER",
            f"Timeout! Retransmitting Message {msg_id} (seq={seq}, attempt {attempt + 1}).",
            msg_id=msg_id, seq=seq,
            extra={"timeout_ms": self.cfg.timeout_ms},
        )
        self._anim(t, "timeout_flash", msg_id=msg_id, seq=seq)

        self._transmit(t, msg_id, seq, attempt + 1, True)


# ─────────────────────────────────────────────────────────────────────────────
# Public API
# ─────────────────────────────────────────────────────────────────────────────

def simulate(cfg: SimConfig) -> SimResult:
    """Run the simulation and return a complete SimResult."""
    engine = _Engine(cfg)
    try:
        engine.run()
        return SimResult(
            success=True,
            config=cfg,
            metrics=engine.metrics,
            events=engine.events,
            animation_hints=engine.anim_hints,
            delivered_messages=engine.delivered,
            model_version="1.0",
            assumptions=MODEL_ASSUMPTIONS,
        )
    except RuntimeError as exc:
        return SimResult(
            success=False,
            config=cfg,
            metrics=engine.metrics,
            events=engine.events,
            animation_hints=engine.anim_hints,
            delivered_messages=engine.delivered,
            error=str(exc),
            model_version="1.0",
            assumptions=MODEL_ASSUMPTIONS,
        )
