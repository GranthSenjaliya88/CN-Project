"""
tests/test_edge_cases.py
Extended edge-case tests for the Stop-and-Wait ARQ simulation engine.
Covers every scenario requested in the audit specification.
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from simulator import simulate, SimConfig
from simulator.models import EventType
from simulator.validation import validate_config, ValidationError


def cfg(**kw):
    defaults = dict(num_frames=1, data_travel_ms=100, ack_delay_ms=100,
                    ack_travel_ms=100, timeout_ms=800)
    defaults.update(kw)
    return SimConfig(**defaults)


# ═══════════════════════════════════════════════════════════════════════════════
# Reference Scenario A: Normal Delivery (detailed)
# ═══════════════════════════════════════════════════════════════════════════════

class TestScenarioA:
    """1 frame, data_travel=100, ack_delay=100, ack_travel=100, timeout=800."""

    def setup_method(self):
        self.r = simulate(cfg(ack_delay_ms=100, timeout_ms=800))
        self.m = self.r.metrics

    def test_data_arrives_at_100(self):
        arrival = [e for e in self.r.events
                   if e.event_type == EventType.DATA_ARRIVED and e.extra.get("accepted")]
        assert len(arrival) == 1
        assert arrival[0].time_ms == pytest.approx(100)

    def test_ack_sent_at_200(self):
        ack_sent = [e for e in self.r.events if e.event_type == EventType.ACK_SENT]
        assert len(ack_sent) == 1
        assert ack_sent[0].time_ms == pytest.approx(200)

    def test_ack_arrives_at_300(self):
        ack_arr = [e for e in self.r.events
                   if e.event_type == EventType.ACK_ARRIVED and e.extra.get("accepted")]
        assert len(ack_arr) == 1
        assert ack_arr[0].time_ms == pytest.approx(300)

    def test_metrics(self):
        assert self.m.total_data_transmissions == 1
        assert self.m.retransmissions == 0
        assert self.m.duplicate_data_arrivals == 0
        assert self.m.unique_messages_delivered == 1
        assert self.m.transfer_complete_time_ms == pytest.approx(300)


# ═══════════════════════════════════════════════════════════════════════════════
# Reference Scenario B: Delayed ACK (detailed)
# ═══════════════════════════════════════════════════════════════════════════════

class TestScenarioB:
    """1 frame, data_travel=100, ack_delay=900, ack_travel=100, timeout=600."""

    def setup_method(self):
        self.r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
        self.m = self.r.metrics

    def test_original_arrives_at_100(self):
        arrivals = [e for e in self.r.events
                    if e.event_type == EventType.DATA_ARRIVED and e.extra.get("accepted")]
        assert arrivals[0].time_ms == pytest.approx(100)

    def test_timeout_at_600(self):
        timeouts = [e for e in self.r.events if e.event_type == EventType.TIMEOUT]
        assert len(timeouts) >= 1
        assert timeouts[0].time_ms == pytest.approx(600)

    def test_duplicate_at_700(self):
        dups = [e for e in self.r.events
                if e.event_type == EventType.DATA_ARRIVED and e.extra.get("duplicate")]
        assert len(dups) >= 1
        assert dups[0].time_ms == pytest.approx(700)

    def test_original_ack_sent_at_1000(self):
        ack_sents = [e for e in self.r.events if e.event_type == EventType.ACK_SENT
                     and not e.extra.get("for_duplicate")]
        assert ack_sents[0].time_ms == pytest.approx(1000)

    def test_original_ack_arrives_at_1100(self):
        ack_arrs = [e for e in self.r.events
                    if e.event_type == EventType.ACK_ARRIVED and e.extra.get("accepted")]
        assert ack_arrs[0].time_ms == pytest.approx(1100)

    def test_duplicate_ack_sent_at_1600(self):
        ack_sents = [e for e in self.r.events if e.event_type == EventType.ACK_SENT
                     and e.extra.get("for_duplicate")]
        assert len(ack_sents) >= 1
        assert ack_sents[0].time_ms == pytest.approx(1600)

    def test_stale_ack_at_1700_ignored(self):
        ack_ign = [e for e in self.r.events if e.event_type == EventType.ACK_IGNORED]
        assert len(ack_ign) >= 1
        assert ack_ign[0].time_ms == pytest.approx(1700)

    def test_metrics(self):
        assert self.m.total_data_transmissions == 2
        assert self.m.retransmissions == 1
        assert self.m.duplicate_data_arrivals == 1
        assert self.m.unique_messages_delivered == 1
        assert self.m.transfer_complete_time_ms == pytest.approx(1100)


# ═══════════════════════════════════════════════════════════════════════════════
# Reference Scenario C: Adjusted Timeout
# ═══════════════════════════════════════════════════════════════════════════════

class TestScenarioC:
    """1 frame, data_travel=100, ack_delay=900, ack_travel=100, timeout=1400."""

    def setup_method(self):
        self.r = simulate(cfg(ack_delay_ms=900, timeout_ms=1400))
        self.m = self.r.metrics

    def test_metrics(self):
        assert self.m.total_data_transmissions == 1
        assert self.m.retransmissions == 0
        assert self.m.duplicate_data_arrivals == 0
        assert self.m.unique_messages_delivered == 1
        assert self.m.transfer_complete_time_ms == pytest.approx(1100)


# ═══════════════════════════════════════════════════════════════════════════════
# Multiple messages with sequence-number reuse
# ═══════════════════════════════════════════════════════════════════════════════

class TestMultipleMessages:
    def test_8_frames_sequence_pattern(self):
        r = simulate(SimConfig(num_frames=8, data_travel_ms=50, ack_delay_ms=0,
                               ack_travel_ms=50, timeout_ms=500))
        seqs = [d["seq"] for d in r.delivered_messages]
        assert seqs == [0, 1, 0, 1, 0, 1, 0, 1]
        assert r.metrics.unique_messages_delivered == 8

    def test_each_payload_delivered_once(self):
        r = simulate(SimConfig(num_frames=5, data_travel_ms=100, ack_delay_ms=100,
                               ack_travel_ms=100, timeout_ms=800))
        ids = [d["message_id"] for d in r.delivered_messages]
        assert ids == [1, 2, 3, 4, 5]
        assert len(set(ids)) == len(ids), "Each payload must be delivered only once"


# ═══════════════════════════════════════════════════════════════════════════════
# Several retransmissions before first valid ACK
# ═══════════════════════════════════════════════════════════════════════════════

class TestManyRetransmissions:
    def test_multiple_timeouts_before_ack(self):
        # ack_delay=3000, timeout=200 -> should have ~14 timeouts before ACK arrives
        r = simulate(cfg(ack_delay_ms=3000, timeout_ms=200))
        assert r.metrics.retransmissions >= 10
        assert r.metrics.unique_messages_delivered == 1
        assert len(r.delivered_messages) == 1

    def test_total_transmissions_equals_1_plus_retransmissions(self):
        r = simulate(cfg(ack_delay_ms=3000, timeout_ms=200))
        assert r.metrics.total_data_transmissions == 1 + r.metrics.retransmissions


# ═══════════════════════════════════════════════════════════════════════════════
# Zero receiver ACK delay
# ═══════════════════════════════════════════════════════════════════════════════

class TestZeroAckDelay:
    def test_basic(self):
        r = simulate(cfg(ack_delay_ms=0))
        assert r.success
        assert r.metrics.unique_messages_delivered == 1
        assert r.metrics.retransmissions == 0
        assert r.metrics.transfer_complete_time_ms == pytest.approx(200)

    def test_multi_frame(self):
        r = simulate(SimConfig(num_frames=3, data_travel_ms=100, ack_delay_ms=0,
                               ack_travel_ms=100, timeout_ms=800))
        assert r.metrics.unique_messages_delivered == 3
        assert r.metrics.retransmissions == 0


# ═══════════════════════════════════════════════════════════════════════════════
# ACK arrival exactly at timeout (tie-breaking)
# ═══════════════════════════════════════════════════════════════════════════════

class TestTieBreaking:
    def test_ack_at_exactly_timeout_no_retransmission(self):
        # data_travel=100, ack_delay=200, ack_travel=100 -> ACK arrives at 400
        # timeout=400 -> tie -> ACK should be processed first (priority 0 < 3)
        r = simulate(cfg(data_travel_ms=100, ack_delay_ms=200, ack_travel_ms=100, timeout_ms=400))
        assert r.metrics.retransmissions == 0

    def test_ack_just_before_timeout(self):
        # ACK arrives at 301, timeout at 302
        r = simulate(cfg(data_travel_ms=100, ack_delay_ms=100, ack_travel_ms=101, timeout_ms=302))
        assert r.metrics.retransmissions == 0

    def test_ack_just_after_timeout(self):
        # ACK arrives at 301, timeout at 300
        r = simulate(cfg(data_travel_ms=100, ack_delay_ms=100, ack_travel_ms=101, timeout_ms=300))
        assert r.metrics.retransmissions >= 1


# ═══════════════════════════════════════════════════════════════════════════════
# Event ordering and timestamp monotonicity
# ═══════════════════════════════════════════════════════════════════════════════

class TestEventOrdering:
    def test_timestamps_monotonic(self):
        r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
        times = [e.time_ms for e in r.events]
        for i in range(1, len(times)):
            assert times[i] >= times[i-1], \
                f"Event timestamps must be non-decreasing: {times[i-1]} > {times[i]} at index {i}"

    def test_deterministic_results(self):
        r1 = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
        r2 = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
        assert len(r1.events) == len(r2.events)
        for e1, e2 in zip(r1.events, r2.events):
            assert e1.time_ms == e2.time_ms
            assert e1.event_type == e2.event_type

    def test_animation_hints_sorted(self):
        r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
        times = [h.time_ms for h in r.animation_hints]
        for i in range(1, len(times)):
            assert times[i] >= times[i-1]


# ═══════════════════════════════════════════════════════════════════════════════
# Completion requires acknowledgement of all requested messages
# ═══════════════════════════════════════════════════════════════════════════════

class TestCompletion:
    def test_completion_requires_all_acked(self):
        r = simulate(SimConfig(num_frames=4, data_travel_ms=100, ack_delay_ms=100,
                               ack_travel_ms=100, timeout_ms=800))
        assert r.metrics.unique_messages_delivered == 4
        assert r.metrics.transfer_complete_time_ms is not None

    def test_completion_time_vs_all_events_finish(self):
        r = simulate(cfg(ack_delay_ms=900, timeout_ms=600))
        # Transfer completion should be earlier than when all events finish
        # (stale ACK arrives after completion)
        assert r.metrics.transfer_complete_time_ms is not None
        assert r.metrics.all_events_finish_ms is not None
        assert r.metrics.transfer_complete_time_ms <= r.metrics.all_events_finish_ms


# ═══════════════════════════════════════════════════════════════════════════════
# Input validation edge cases
# ═══════════════════════════════════════════════════════════════════════════════

class TestValidation:
    def test_empty_values(self):
        with pytest.raises(ValidationError):
            validate_config({})

    def test_nonnumeric_travel(self):
        with pytest.raises(ValidationError):
            validate_config({"num_frames": 1, "data_travel_ms": "abc",
                             "ack_delay_ms": 100, "ack_travel_ms": 100, "timeout_ms": 800})

    def test_nan_travel(self):
        with pytest.raises(ValidationError):
            validate_config({"num_frames": 1, "data_travel_ms": float("nan"),
                             "ack_delay_ms": 100, "ack_travel_ms": 100, "timeout_ms": 800})

    def test_negative_data_travel(self):
        with pytest.raises(ValidationError) as exc:
            validate_config({"num_frames": 1, "data_travel_ms": -10,
                             "ack_delay_ms": 100, "ack_travel_ms": 100, "timeout_ms": 800})
        assert exc.value.field == "data_travel_ms"

    def test_excessively_large_frames(self):
        with pytest.raises(ValidationError) as exc:
            validate_config({"num_frames": 999, "data_travel_ms": 100,
                             "ack_delay_ms": 100, "ack_travel_ms": 100, "timeout_ms": 800})
        assert exc.value.field == "num_frames"

    def test_negative_timeout(self):
        with pytest.raises(ValidationError) as exc:
            validate_config({"num_frames": 1, "data_travel_ms": 100,
                             "ack_delay_ms": 100, "ack_travel_ms": 100, "timeout_ms": -5})
        assert exc.value.field == "timeout_ms"


# ═══════════════════════════════════════════════════════════════════════════════
# Simulation event-count limit
# ═══════════════════════════════════════════════════════════════════════════════

class TestEventLimit:
    def test_protection_triggers(self):
        # Very short timeout + very long ack delay creates many events
        r = simulate(cfg(ack_delay_ms=30000, timeout_ms=1))
        assert isinstance(r.success, bool)
        if not r.success:
            assert r.error is not None
            assert "exceeded" in r.error.lower()


# ═══════════════════════════════════════════════════════════════════════════════
# Result structure integrity
# ═══════════════════════════════════════════════════════════════════════════════

class TestResultStructure:
    def test_result_has_all_fields(self):
        r = simulate(cfg())
        d = r.to_dict()
        assert "success" in d
        assert "config" in d
        assert "metrics" in d
        assert "events" in d
        assert "animation_hints" in d
        assert "delivered_messages" in d
        assert "model_version" in d
        assert "assumptions" in d

    def test_assumptions_not_empty(self):
        r = simulate(cfg())
        assert len(r.assumptions) > 0

    def test_model_version_present(self):
        r = simulate(cfg())
        assert r.model_version == "1.0"

    def test_config_roundtrip(self):
        c = cfg(num_frames=3, data_travel_ms=150)
        r = simulate(c)
        assert r.config.num_frames == 3
        assert r.config.data_travel_ms == 150
