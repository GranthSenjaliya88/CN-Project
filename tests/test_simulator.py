"""
tests/test_simulator.py
Unit tests for the Stop-and-Wait ARQ simulator engine.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from simulator import simulate


def test_normal_delivery():
    """Scenario A: Normal delivery — no retransmissions, no duplicates."""
    result = simulate(
        num_frames=1,
        data_travel_ms=100,
        ack_delay_ms=100,
        ack_travel_ms=100,
        timeout_ms=800,
    )
    m = result["metrics"]
    assert m["total_transmissions"] == 1, f"Expected 1 transmission, got {m['total_transmissions']}"
    assert m["retransmissions"] == 0, f"Expected 0 retransmissions, got {m['retransmissions']}"
    assert m["duplicates"] == 0, f"Expected 0 duplicates, got {m['duplicates']}"
    assert m["unique_delivered"] == 1, f"Expected 1 delivery, got {m['unique_delivered']}"
    assert m["transfer_complete_time"] == 300, f"Expected completion at 300ms, got {m['transfer_complete_time']}"
    print("PASS: test_normal_delivery")


def test_delayed_ack_retransmission():
    """Scenario B: Delayed ACK causes one retransmission and one duplicate."""
    result = simulate(
        num_frames=1,
        data_travel_ms=100,
        ack_delay_ms=900,
        ack_travel_ms=100,
        timeout_ms=600,
    )
    m = result["metrics"]
    assert m["total_transmissions"] == 2, f"Expected 2 transmissions, got {m['total_transmissions']}"
    assert m["retransmissions"] == 1, f"Expected 1 retransmission, got {m['retransmissions']}"
    assert m["duplicates"] == 1, f"Expected 1 duplicate, got {m['duplicates']}"
    assert m["unique_delivered"] == 1, f"Expected 1 unique delivery, got {m['unique_delivered']}"
    assert m["transfer_complete_time"] == 1100, f"Expected completion at 1100ms, got {m['transfer_complete_time']}"
    print("PASS: test_delayed_ack_retransmission")


def test_adjusted_timeout():
    """Scenario C: Larger timeout — no retransmission despite delayed ACK."""
    result = simulate(
        num_frames=1,
        data_travel_ms=100,
        ack_delay_ms=900,
        ack_travel_ms=100,
        timeout_ms=1400,
    )
    m = result["metrics"]
    assert m["total_transmissions"] == 1, f"Expected 1 transmission, got {m['total_transmissions']}"
    assert m["retransmissions"] == 0, f"Expected 0 retransmissions, got {m['retransmissions']}"
    assert m["duplicates"] == 0, f"Expected 0 duplicates, got {m['duplicates']}"
    assert m["unique_delivered"] == 1, f"Expected 1 unique delivery, got {m['unique_delivered']}"
    assert m["transfer_complete_time"] == 1100, f"Expected completion at 1100ms, got {m['transfer_complete_time']}"
    print("PASS: test_adjusted_timeout")


def test_duplicate_suppression():
    """Ensure duplicate frames are suppressed and not delivered twice."""
    result = simulate(
        num_frames=1,
        data_travel_ms=100,
        ack_delay_ms=900,
        ack_travel_ms=100,
        timeout_ms=600,
    )
    assert result["metrics"]["unique_delivered"] == 1
    assert len(result["delivered_messages"]) == 1
    print("PASS: test_duplicate_suppression")


def test_stale_timer_no_extra_retransmission():
    """Once an ACK is received the stale timer must not cause a retransmission."""
    result = simulate(
        num_frames=1,
        data_travel_ms=100,
        ack_delay_ms=100,
        ack_travel_ms=100,
        timeout_ms=800,
    )
    assert result["metrics"]["retransmissions"] == 0
    print("PASS: test_stale_timer_no_extra_retransmission")


def test_multi_frame_delivery():
    """Four frames all delivered with no retransmissions under ideal conditions."""
    result = simulate(
        num_frames=4,
        data_travel_ms=100,
        ack_delay_ms=100,
        ack_travel_ms=100,
        timeout_ms=800,
    )
    m = result["metrics"]
    assert m["unique_delivered"] == 4
    assert m["retransmissions"] == 0
    print("PASS: test_multi_frame_delivery")


if __name__ == "__main__":
    test_normal_delivery()
    test_delayed_ack_retransmission()
    test_adjusted_timeout()
    test_duplicate_suppression()
    test_stale_timer_no_extra_retransmission()
    test_multi_frame_delivery()
    print("\nAll tests passed.")
