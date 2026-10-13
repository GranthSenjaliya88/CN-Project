"""
tests/test_engine.py
Comprehensive pytest tests for the Stop-and-Wait ARQ simulation engine.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from simulator import simulate, SimConfig
from simulator.models import EventType


def cfg(**kw):
    defaults = dict(num_frames=1, data_travel_ms=100, ack_delay_ms=100,
                    ack_travel_ms=100, timeout_ms=800)
    defaults.update(kw)
    return SimConfig(**defaults)


# ─────────────────────────────────────────────────────────────────────────────
# Reference scenario A: Normal delivery
# ─────────────────────────────────────────────────────────────────────────────

def test_normal_delivery_transmissions():
    r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
    assert r.metrics.total_data_transmissions == 1

def test_normal_delivery_retransmissions():
    r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
    assert r.metrics.retransmissions == 0

def test_normal_delivery_duplicates():
    r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
    assert r.metrics.duplicate_data_arrivals == 0

def test_normal_delivery_unique_delivered():
    r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
    assert r.metrics.unique_messages_delivered == 1

def test_normal_delivery_completion_time():
    r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
    assert r.metrics.transfer_complete_time_ms == pytest.approx(300)


# ─────────────────────────────────────────────────────────────────────────────
# Reference scenario B: Delayed ACK retransmission
# ─────────────────────────────────────────────────────────────────────────────

def test_delayed_ack_transmissions():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert r.metrics.total_data_transmissions == 2

def test_delayed_ack_retransmissions():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert r.metrics.retransmissions == 1

def test_delayed_ack_duplicates():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert r.metrics.duplicate_data_arrivals == 1

def test_delayed_ack_unique_delivered():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert r.metrics.unique_messages_delivered == 1

def test_delayed_ack_completion_time():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert r.metrics.transfer_complete_time_ms == pytest.approx(1100)

def test_delayed_ack_acks_ignored():
    # Duplicate ACK arrives at 1700 ms and must be ignored
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert r.metrics.acks_ignored >= 1


# ─────────────────────────────────────────────────────────────────────────────
# Reference scenario C: Adjusted timeout
# ─────────────────────────────────────────────────────────────────────────────

def test_adjusted_timeout_transmissions():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=1400))
    assert r.metrics.total_data_transmissions == 1

def test_adjusted_timeout_retransmissions():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=1400))
    assert r.metrics.retransmissions == 0

def test_adjusted_timeout_duplicates():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=1400))
    assert r.metrics.duplicate_data_arrivals == 0

def test_adjusted_timeout_completion_time():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=1400))
    assert r.metrics.transfer_complete_time_ms == pytest.approx(1100)


# ─────────────────────────────────────────────────────────────────────────────
# Duplicate payload delivered only once
# ─────────────────────────────────────────────────────────────────────────────

def test_duplicate_suppression_one_delivery():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert len(r.delivered_messages) == 1

def test_duplicate_suppression_message_count_matches_unique():
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert len(r.delivered_messages) == r.metrics.unique_messages_delivered


# ─────────────────────────────────────────────────────────────────────────────
# Multiple messages and sequence-number alternation
# ─────────────────────────────────────────────────────────────────────────────

def test_four_frames_all_delivered():
    r = simulate(SimConfig(num_frames=4, data_travel_ms=100, ack_delay_ms=100,
                           ack_travel_ms=100, timeout_ms=800))
    assert r.metrics.unique_messages_delivered == 4

def test_four_frames_no_retransmissions():
    r = simulate(SimConfig(num_frames=4, data_travel_ms=100, ack_delay_ms=100,
                           ack_travel_ms=100, timeout_ms=800))
    assert r.metrics.retransmissions == 0

def test_sequence_alternation():
    r = simulate(SimConfig(num_frames=4, data_travel_ms=100, ack_delay_ms=100,
                           ack_travel_ms=100, timeout_ms=800))
    seqs = [d["seq"] for d in r.delivered_messages]
    assert seqs == [0, 1, 0, 1]


# ─────────────────────────────────────────────────────────────────────────────
# Multiple timeouts before the first valid ACK
# ─────────────────────────────────────────────────────────────────────────────

def test_multiple_timeouts():
    # With ack_delay=2000 and timeout=300 we expect ~6 timeouts before ACK arrives
    r = simulate(cfg(ack_delay_ms=2000, timeout_ms=300))
    assert r.metrics.retransmissions >= 5
    assert r.metrics.unique_messages_delivered == 1
    assert len(r.delivered_messages) == 1


# ─────────────────────────────────────────────────────────────────────────────
# Timer invalidation (stale timer must not retransmit)
# ─────────────────────────────────────────────────────────────────────────────

def test_stale_timer_no_extra_retransmission():
    r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
    assert r.metrics.retransmissions == 0

def test_stale_timer_no_double_delivery():
    r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
    assert r.metrics.unique_messages_delivered == 1


# ─────────────────────────────────────────────────────────────────────────────
# Unexpected ACK handling
# ─────────────────────────────────────────────────────────────────────────────

def test_unexpected_ack_ignored():
    # In delayed scenario the second ACK (from duplicate) must be ignored
    r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    ack_ignored_events = [e for e in r.events if e.event_type == EventType.ACK_IGNORED]
    assert len(ack_ignored_events) >= 1


# ─────────────────────────────────────────────────────────────────────────────
# ACK / timeout tie-breaking
# ─────────────────────────────────────────────────────────────────────────────

def test_ack_timeout_tiebreak_no_extra_retransmission():
    # Craft parameters so ACK arrives exactly at timeout boundary
    # data_travel=100, ack_delay=300, ack_travel=100 → ack arrives at 500ms; timeout=500ms
    # Tie → ACK processed first → no retransmission
    r = simulate(cfg(data_travel_ms=100, ack_delay_ms=300, ack_travel_ms=100, timeout_ms=500))
    assert r.metrics.retransmissions == 0


# ─────────────────────────────────────────────────────────────────────────────
# Zero ACK delay
# ─────────────────────────────────────────────────────────────────────────────

def test_zero_ack_delay():
    r = simulate(cfg(ack_delay_ms=0, timeout_ms=800))
    assert r.success
    assert r.metrics.unique_messages_delivered == 1
    assert r.metrics.retransmissions == 0

def test_zero_ack_delay_completion_time():
    # ACK arrives at data_travel + 0 + ack_travel = 200 ms
    r = simulate(cfg(data_travel_ms=100, ack_delay_ms=0, ack_travel_ms=100, timeout_ms=800))
    assert r.metrics.transfer_complete_time_ms == pytest.approx(200)


# ─────────────────────────────────────────────────────────────────────────────
# Input validation
# ─────────────────────────────────────────────────────────────────────────────

from simulator.validation import validate_config, ValidationError

def test_validation_rejects_zero_frames():
    with pytest.raises(ValidationError) as exc:
        validate_config({"num_frames": 0, "data_travel_ms": 100, "ack_delay_ms": 100,
                         "ack_travel_ms": 100, "timeout_ms": 800})
    assert exc.value.field == "num_frames"

def test_validation_rejects_negative_ack_delay():
    with pytest.raises(ValidationError) as exc:
        validate_config({"num_frames": 1, "data_travel_ms": 100, "ack_delay_ms": -1,
                         "ack_travel_ms": 100, "timeout_ms": 800})
    assert exc.value.field == "ack_delay_ms"

def test_validation_rejects_zero_timeout():
    with pytest.raises(ValidationError) as exc:
        validate_config({"num_frames": 1, "data_travel_ms": 100, "ack_delay_ms": 100,
                         "ack_travel_ms": 100, "timeout_ms": 0})
    assert exc.value.field == "timeout_ms"

def test_validation_rejects_infinite_travel():
    with pytest.raises(ValidationError):
        validate_config({"num_frames": 1, "data_travel_ms": float("inf"), "ack_delay_ms": 100,
                         "ack_travel_ms": 100, "timeout_ms": 800})

def test_validation_rejects_too_many_frames():
    with pytest.raises(ValidationError) as exc:
        validate_config({"num_frames": 99, "data_travel_ms": 100, "ack_delay_ms": 100,
                         "ack_travel_ms": 100, "timeout_ms": 800})
    assert exc.value.field == "num_frames"


# ─────────────────────────────────────────────────────────────────────────────
# Event-count protection
# ─────────────────────────────────────────────────────────────────────────────

def test_event_count_protection():
    # Very short timeout + very large ack_delay would create many events
    r = simulate(cfg(ack_delay_ms=30000, timeout_ms=1))
    # Either succeeds with finite events or returns a graceful error
    assert isinstance(r.success, bool)
    if not r.success:
        assert r.error is not None and "exceeded" in r.error.lower()


# ─────────────────────────────────────────────────────────────────────────────
# Playback speed does not change results
# ─────────────────────────────────────────────────────────────────────────────

def test_results_independent_of_playback_speed():
    """Playback speed is a frontend concept; the backend produces identical results."""
    r1 = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    r2 = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
    assert r1.metrics.total_data_transmissions == r2.metrics.total_data_transmissions
    assert r1.metrics.retransmissions == r2.metrics.retransmissions
    assert len(r1.events) == len(r2.events)
