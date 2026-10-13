"""
simulator/models.py
Dataclasses and enumerations for the Stop-and-Wait ARQ simulation engine.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


# ─────────────────────────────────────────────────────────────────────────────
# Enumerations
# ─────────────────────────────────────────────────────────────────────────────

class SenderState(str, Enum):
    READY         = "Ready"
    WAITING       = "Waiting for ACK"
    RETRANSMITTING = "Retransmitting"
    COMPLETE      = "Complete"


class ReceiverState(str, Enum):
    READY        = "Ready"
    ACCEPTED     = "Frame Accepted"
    DUPLICATE    = "Duplicate Discarded"
    ACK_PENDING  = "ACK Pending"
    ACK_SENT     = "ACK Sent"


class EventType(str, Enum):
    DATA_SENT          = "data_sent"
    DATA_ARRIVED       = "data_arrived"
    PAYLOAD_DELIVERED  = "payload_delivered"
    ACK_SCHEDULED      = "ack_scheduled"
    ACK_SENT           = "ack_sent"
    ACK_ARRIVED        = "ack_arrived"
    ACK_ACCEPTED       = "ack_accepted"
    ACK_IGNORED        = "ack_ignored"
    TIMEOUT            = "timeout"
    DUPLICATE_DISCARDED = "duplicate_discarded"
    TRANSFER_COMPLETE  = "transfer_complete"


# ─────────────────────────────────────────────────────────────────────────────
# Simulation event
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SimEvent:
    """A single event in the simulation output trace."""
    time_ms:     float
    event_type:  EventType
    actor:       str                      # "SENDER" | "RECEIVER" | "CHANNEL"
    message_id:  Optional[int]  = None   # 1-indexed unique message identity
    sequence:    Optional[int]  = None   # alternating 0 / 1
    attempt:     Optional[int]  = None   # transmission attempt number
    is_retransmission: bool     = False
    description: str            = ""
    extra:       Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "time_ms":          self.time_ms,
            "event_type":       self.event_type.value,
            "actor":            self.actor,
            "message_id":       self.message_id,
            "sequence":         self.sequence,
            "attempt":          self.attempt,
            "is_retransmission": self.is_retransmission,
            "description":      self.description,
            **self.extra,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Animation hint (consumed by React Three Fiber playback engine)
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class AnimationHint:
    """Lightweight animation descriptor returned alongside events."""
    time_ms:    float
    anim_type:  str    # "packet_launch" | "packet_arrive" | "timeout_flash" | ...
    extra:      Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {"time_ms": self.time_ms, "anim_type": self.anim_type, **self.extra}


# ─────────────────────────────────────────────────────────────────────────────
# Simulation configuration
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SimConfig:
    num_frames:     int
    data_travel_ms: float
    ack_delay_ms:   float
    ack_travel_ms:  float
    timeout_ms:     float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "num_frames":     self.num_frames,
            "data_travel_ms": self.data_travel_ms,
            "ack_delay_ms":   self.ack_delay_ms,
            "ack_travel_ms":  self.ack_travel_ms,
            "timeout_ms":     self.timeout_ms,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Simulation metrics
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SimMetrics:
    unique_messages_requested: int   = 0
    unique_messages_delivered:  int  = 0
    total_data_transmissions:  int   = 0
    retransmissions:           int   = 0
    duplicate_data_arrivals:   int   = 0
    acks_sent:                 int   = 0
    acks_accepted:             int   = 0
    acks_ignored:              int   = 0
    transfer_complete_time_ms: Optional[float] = None
    all_events_finish_ms:      Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "unique_messages_requested": self.unique_messages_requested,
            "unique_messages_delivered":  self.unique_messages_delivered,
            "total_data_transmissions":  self.total_data_transmissions,
            "retransmissions":           self.retransmissions,
            "duplicate_data_arrivals":   self.duplicate_data_arrivals,
            "acks_sent":                 self.acks_sent,
            "acks_accepted":             self.acks_accepted,
            "acks_ignored":              self.acks_ignored,
            "transfer_complete_time_ms": self.transfer_complete_time_ms,
            "all_events_finish_ms":      self.all_events_finish_ms,
        }


# ─────────────────────────────────────────────────────────────────────────────
# Full simulation result
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SimResult:
    success:           bool
    config:            SimConfig
    metrics:           SimMetrics
    events:            List[SimEvent]           = field(default_factory=list)
    animation_hints:   List[AnimationHint]      = field(default_factory=list)
    delivered_messages: List[Dict[str, Any]]    = field(default_factory=list)
    error:             Optional[str]            = None
    model_version:     str                      = "1.0"
    assumptions:       List[str]                = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success":            self.success,
            "model_version":      self.model_version,
            "assumptions":        self.assumptions,
            "config":             self.config.to_dict(),
            "metrics":            self.metrics.to_dict(),
            "events":             [e.to_dict() for e in self.events],
            "animation_hints":    [a.to_dict() for a in self.animation_hints],
            "delivered_messages": self.delivered_messages,
            "error":              self.error,
        }
