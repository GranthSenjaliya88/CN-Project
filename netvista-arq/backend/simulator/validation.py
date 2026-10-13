"""
simulator/validation.py
Input validation for the Stop-and-Wait ARQ simulation engine.
"""

from __future__ import annotations
from typing import Any, Dict, List, Optional, Tuple
import math


MAX_FRAMES = 20
MAX_TRAVEL_MS = 3_600_000
MAX_TIMEOUT_MS = 3_600_000
MAX_ACK_DELAY_MS = 3_600_000


class ValidationError(Exception):
    def __init__(self, field: str, message: str):
        super().__init__(message)
        self.field = field
        self.message = message


def _require_finite_positive(value: Any, field: str, label: str) -> float:
    if isinstance(value, bool):
        raise ValidationError(field, f"{label} must be a number, not a boolean.")
    try:
        v = float(value)
    except (TypeError, ValueError, OverflowError):
        raise ValidationError(field, f"{label} must be a number.")
    if not math.isfinite(v):
        raise ValidationError(field, f"{label} must be a finite number.")
    if v <= 0:
        raise ValidationError(field, f"{label} must be greater than 0.")
    return v


def _require_finite_nonneg(value: Any, field: str, label: str) -> float:
    if isinstance(value, bool):
        raise ValidationError(field, f"{label} must be a number, not a boolean.")
    try:
        v = float(value)
    except (TypeError, ValueError, OverflowError):
        raise ValidationError(field, f"{label} must be a number.")
    if not math.isfinite(v):
        raise ValidationError(field, f"{label} must be a finite number.")
    if v < 0:
        raise ValidationError(field, f"{label} must be 0 or greater.")
    return v


def validate_config(raw: Dict[str, Any]) -> Tuple[int, float, float, float, float]:
    """
    Validate raw config dict. Returns (num_frames, data_travel, ack_delay, ack_travel, timeout).
    Raises ValidationError on the first problem found.
    """
    if not isinstance(raw, dict):
        raise ValidationError("body", "Configuration must be a JSON object.")
    value = raw.get("num_frames")
    try:
        number = float(value)
    except (TypeError, ValueError, OverflowError):
        raise ValidationError("num_frames", "Number of frames must be an integer.")
    if isinstance(value, bool) or not math.isfinite(number) or not number.is_integer():
        raise ValidationError("num_frames", "Number of frames must be a finite integer.")
    nf = int(number)
    if nf < 1 or nf > MAX_FRAMES:
        raise ValidationError("num_frames", f"Number of frames must be between 1 and {MAX_FRAMES}.")

    dt  = _require_finite_positive(raw.get("data_travel_ms"),  "data_travel_ms",  "Data travel time")
    ad  = _require_finite_nonneg  (raw.get("ack_delay_ms"),    "ack_delay_ms",    "Receiver ACK delay")
    at  = _require_finite_positive(raw.get("ack_travel_ms"),   "ack_travel_ms",   "ACK travel time")
    tmo = _require_finite_positive(raw.get("timeout_ms"),      "timeout_ms",      "Sender timeout")

    if dt > MAX_TRAVEL_MS:
        raise ValidationError("data_travel_ms", f"Data travel time must not exceed {MAX_TRAVEL_MS} ms.")
    if at > MAX_TRAVEL_MS:
        raise ValidationError("ack_travel_ms", f"ACK travel time must not exceed {MAX_TRAVEL_MS} ms.")
    if ad > MAX_ACK_DELAY_MS:
        raise ValidationError("ack_delay_ms", f"ACK delay must not exceed {MAX_ACK_DELAY_MS} ms.")
    if tmo > MAX_TIMEOUT_MS:
        raise ValidationError("timeout_ms", f"Timeout must not exceed {MAX_TIMEOUT_MS} ms.")

    return nf, dt, ad, at, tmo
