"""
simulator.py
Stop-and-Wait ARQ simulation engine.
Calculates the complete ordered event trace without any animation logic.
"""

import heapq
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any


MAX_EVENTS = 2000  # Safety cap to prevent runaway simulations


@dataclass(order=True)
class Event:
    time_ms: float
    priority: int  # lower = higher priority at same time
    data: Dict[str, Any] = field(compare=False)


def simulate(
    num_frames: int,
    data_travel_ms: float,
    ack_delay_ms: float,
    ack_travel_ms: float,
    timeout_ms: float,
) -> Dict[str, Any]:
    """
    Run Stop-and-Wait ARQ simulation and return the complete event trace + metrics.

    Tie-breaking rule (same simulation time):
        ACK_ARRIVED < TIMEOUT  (ACK cancels a pending timeout at the same tick)

    Priority mapping:
        0 = ACK_ARRIVED
        1 = DATA_ARRIVED
        2 = ACK_SEND     (receiver actually emits the ACK)
        3 = TIMEOUT
    """

    events: List[Event] = []
    event_log: List[Dict[str, Any]] = []
    animations: List[Dict[str, Any]] = []

    # Metrics
    total_transmissions = 0
    retransmissions = 0
    duplicates = 0
    acks_sent = 0
    delivered_messages = []  # list of {message_id, seq, time_ms}

    # State
    sender_current_msg = 1        # 1-indexed
    sender_seq = 0                # alternating 0/1
    sender_attempt = 0
    receiver_expected_seq = 0
    transfer_complete_time: Optional[float] = None
    pending_ack_cancel: Dict[int, bool] = {}  # seq -> whether current timer cancelled

    # Timer token: each new timer gets a unique ID so stale timers are ignored
    timer_token_counter = [0]
    active_timer_token = [None]  # [current valid token]

    def push(time_ms, priority, data):
        heapq.heappush(events, Event(time_ms=time_ms, priority=priority, data=data))

    def log(time_ms, actor, message, extra=None):
        entry = {"time_ms": time_ms, "actor": actor, "message": message}
        if extra:
            entry.update(extra)
        event_log.append(entry)

    def anim(time_ms, anim_type, **kwargs):
        animations.append({"time_ms": time_ms, "type": anim_type, **kwargs})

    def schedule_timeout(send_time_ms, msg_id, seq, attempt, token):
        """Push a TIMEOUT event with the given token."""
        push(
            send_time_ms + timeout_ms,
            3,
            {
                "event": "TIMEOUT",
                "msg_id": msg_id,
                "seq": seq,
                "attempt": attempt,
                "token": token,
            },
        )

    def transmit_frame(time_ms, msg_id, seq, attempt, is_retransmission):
        nonlocal total_transmissions, retransmissions, sender_attempt

        total_transmissions += 1
        if is_retransmission:
            retransmissions += 1

        label = "Retransmitting" if is_retransmission else "Transmitting"
        log(
            time_ms,
            "SENDER",
            f"Sender {label} Message {msg_id} (seq={seq}, attempt={attempt})",
            {
                "msg_id": msg_id,
                "seq": seq,
                "attempt": attempt,
                "is_retransmission": is_retransmission,
            },
        )
        anim(
            time_ms,
            "DATA_SEND",
            msg_id=msg_id,
            seq=seq,
            attempt=attempt,
            is_retransmission=is_retransmission,
            arrive_at=time_ms + data_travel_ms,
        )

        # Data arrives at receiver
        push(
            time_ms + data_travel_ms,
            1,
            {
                "event": "DATA_ARRIVED",
                "msg_id": msg_id,
                "seq": seq,
                "attempt": attempt,
                "is_retransmission": is_retransmission,
            },
        )

        # Start timeout timer
        timer_token_counter[0] += 1
        token = timer_token_counter[0]
        active_timer_token[0] = token
        schedule_timeout(time_ms, msg_id, seq, attempt, token)

        return token

    # --- Kick off: transmit first frame at t=0 ---
    transmit_frame(0, 1, 0, 1, False)

    processed = 0
    while events and processed < MAX_EVENTS:
        ev = heapq.heappop(events)
        t = ev.time_ms
        d = ev.data
        processed += 1

        if d["event"] == "DATA_ARRIVED":
            msg_id = d["msg_id"]
            seq = d["seq"]
            attempt = d["attempt"]
            is_retransmission = d["is_retransmission"]

            if seq == receiver_expected_seq:
                # New frame — accept and deliver
                receiver_expected_seq ^= 1
                delivered_messages.append(
                    {"message_id": msg_id, "seq": seq, "time_ms": t}
                )
                log(
                    t,
                    "RECEIVER",
                    f"Receiver accepted Message {msg_id} (seq={seq}); payload delivered.",
                    {"msg_id": msg_id, "seq": seq, "accepted": True},
                )
                anim(t, "DATA_RECEIVED", msg_id=msg_id, seq=seq, accepted=True)

                # Schedule ACK
                ack_send_time = t + ack_delay_ms
                log(
                    t,
                    "RECEIVER",
                    f"ACK {seq} scheduled to send at {ack_send_time:.0f} ms",
                    {"ack_send_time": ack_send_time, "seq": seq},
                )
                push(
                    ack_send_time,
                    2,
                    {"event": "ACK_SEND", "seq": seq, "msg_id": msg_id},
                )
            else:
                # Duplicate frame
                duplicates += 1
                log(
                    t,
                    "RECEIVER",
                    f"Receiver discarded duplicate (seq={seq}). Payload already delivered.",
                    {"msg_id": msg_id, "seq": seq, "accepted": False, "duplicate": True},
                )
                anim(t, "DATA_RECEIVED", msg_id=msg_id, seq=seq, accepted=False, duplicate=True)

                # Still send an ACK for the duplicate
                ack_send_time = t + ack_delay_ms
                log(
                    t,
                    "RECEIVER",
                    f"ACK {seq} (for duplicate) scheduled at {ack_send_time:.0f} ms",
                    {"ack_send_time": ack_send_time, "seq": seq, "for_duplicate": True},
                )
                push(
                    ack_send_time,
                    2,
                    {"event": "ACK_SEND", "seq": seq, "msg_id": msg_id, "for_duplicate": True},
                )

        elif d["event"] == "ACK_SEND":
            seq = d["seq"]
            msg_id = d["msg_id"]
            for_dup = d.get("for_duplicate", False)
            acks_sent += 1
            label = " (duplicate ACK)" if for_dup else ""
            log(
                t,
                "RECEIVER",
                f"Receiver sent ACK {seq}{label}",
                {"seq": seq, "msg_id": msg_id, "for_duplicate": for_dup},
            )
            anim(
                t,
                "ACK_SEND",
                seq=seq,
                msg_id=msg_id,
                for_duplicate=for_dup,
                arrive_at=t + ack_travel_ms,
            )
            push(
                t + ack_travel_ms,
                0,
                {"event": "ACK_ARRIVED", "seq": seq, "msg_id": msg_id, "for_duplicate": for_dup},
            )

        elif d["event"] == "ACK_ARRIVED":
            seq = d["seq"]
            msg_id = d["msg_id"]
            for_dup = d.get("for_duplicate", False)

            # Check if sender is still waiting for this seq
            current_sender_seq = sender_seq  # seq number sender is waiting for
            if seq == current_sender_seq and sender_current_msg <= num_frames:
                # Cancel active timer
                active_timer_token[0] = None  # invalidate
                log(
                    t,
                    "SENDER",
                    f"Sender received ACK {seq} for Message {msg_id}; timer cancelled.",
                    {"seq": seq, "msg_id": msg_id},
                )
                anim(t, "ACK_RECEIVED", seq=seq, msg_id=msg_id, for_duplicate=for_dup)

                if transfer_complete_time is None:
                    transfer_complete_time = t

                # Advance to next message
                sender_current_msg += 1
                sender_seq ^= 1
                sender_attempt = 0

                if sender_current_msg <= num_frames:
                    # Transmit next frame
                    transmit_frame(t, sender_current_msg, sender_seq, 1, False)
                else:
                    log(t, "SENDER", "All messages acknowledged. Transfer complete.", {"complete": True})
                    anim(t, "TRANSFER_COMPLETE")
            else:
                # Stale or unexpected ACK — ignore
                log(
                    t,
                    "SENDER",
                    f"Sender ignored stale/unexpected ACK {seq}.",
                    {"seq": seq, "stale": True},
                )
                anim(t, "ACK_RECEIVED", seq=seq, msg_id=msg_id, for_duplicate=for_dup, stale=True)

        elif d["event"] == "TIMEOUT":
            token = d["token"]
            if token != active_timer_token[0]:
                # Stale timer — ignore
                continue

            msg_id = d["msg_id"]
            seq = d["seq"]
            attempt = d["attempt"]

            log(
                t,
                "SENDER",
                f"Sender timeout! Retransmitting Message {msg_id} (seq={seq}, attempt={attempt+1})",
                {"msg_id": msg_id, "seq": seq, "timeout": True},
            )
            anim(t, "TIMEOUT", msg_id=msg_id, seq=seq)

            # Retransmit
            transmit_frame(t, msg_id, seq, attempt + 1, True)

    # Build final result
    all_finish_time = max((e["time_ms"] for e in event_log), default=0)

    return {
        "success": True,
        "config": {
            "num_frames": num_frames,
            "data_travel_ms": data_travel_ms,
            "ack_delay_ms": ack_delay_ms,
            "ack_travel_ms": ack_travel_ms,
            "timeout_ms": timeout_ms,
        },
        "metrics": {
            "total_transmissions": total_transmissions,
            "retransmissions": retransmissions,
            "duplicates": duplicates,
            "unique_delivered": len(delivered_messages),
            "acks_sent": acks_sent,
            "transfer_complete_time": transfer_complete_time,
            "all_events_finish_time": all_finish_time,
        },
        "delivered_messages": delivered_messages,
        "event_log": event_log,
        "animations": sorted(animations, key=lambda x: x["time_ms"]),
    }
