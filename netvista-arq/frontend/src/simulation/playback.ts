// src/simulation/playback.ts
// Pure playback logic — no React, no Three.js

import type {
  SimResult, SimEvent, PlaybackState,
  LiveSenderState, LiveReceiverState, LiveMetrics, InFlightPacket,
} from '../types/simulation';

// ─── Initial state factories ──────────────────────────────────────────────────

export function makeInitialPlayback(totalTimeMs: number): PlaybackState {
  return {
    status: 'idle',
    currentTimeMs: 0,
    totalTimeMs,
    speed: 1,
    eventIndex: 0,
    eventsApplied: [],
  };
}

export function makeInitialSenderState(config?: { timeout_ms: number }): LiveSenderState {
  return {
    state: 'Ready',
    currentMessage: null,
    sequence: null,
    attempt: null,
    timeoutMs: config?.timeout_ms ?? 0,
    timerStartMs: null,
  };
}

export function makeInitialReceiverState(): LiveReceiverState {
  return {
    state: 'Ready',
    expectedSeq: 0,
    lastReceivedSeq: null,
    lastOutcome: null,
    pendingAcks: 0,
    nextAckTimeMs: null,
    uniqueDelivered: 0,
  };
}

export function makeInitialMetrics(): LiveMetrics {
  return {
    transmissions: 0,
    retransmissions: 0,
    duplicates: 0,
    delivered: 0,
    acksSent: 0,
    completionTime: null,
  };
}

// ─── Derive live state from all events up to currentTimeMs ───────────────────

export function deriveState(
  result: SimResult,
  upToTimeMs: number
): {
  sender: LiveSenderState;
  receiver: LiveReceiverState;
  metrics: LiveMetrics;
  inFlight: InFlightPacket[];
  appliedEvents: SimEvent[];
} {
  const sender = makeInitialSenderState({ timeout_ms: result.config.timeout_ms });
  const receiver = makeInitialReceiverState();
  const metrics = makeInitialMetrics();
  const inFlight: InFlightPacket[] = [];
  const appliedEvents: SimEvent[] = [];

  // Build a map of in-flight packets from animation hints
  const activePackets = new Map<string, InFlightPacket>();

  for (const hint of result.animation_hints) {
    if (hint.anim_type !== 'packet_launch') continue;
    const id = `${hint.direction}-${hint.msg_id}-${hint.seq}-${hint.attempt ?? 0}-${hint.time_ms}`;
    activePackets.set(id, {
      id,
      direction: hint.direction!,
      seq: hint.seq!,
      msgId: hint.msg_id!,
      label: hint.packet_label ?? `${hint.direction?.toUpperCase()} ${hint.seq}`,
      isRetransmission: hint.is_retransmission ?? false,
      forDuplicate: hint.for_duplicate ?? false,
      launchTimeMs: hint.time_ms,
      arriveTimeMs: hint.arrive_at!,
    });
  }

  // Compute in-flight packets at upToTimeMs
  for (const [, pkt] of activePackets) {
    if (pkt.launchTimeMs <= upToTimeMs && pkt.arriveTimeMs > upToTimeMs) {
      inFlight.push(pkt);
    }
  }

  // Walk events to derive live state
  let pendingAcks = 0;
  const scheduledAcks:number[]=[];

  for (const ev of result.events) {
    if (ev.time_ms > upToTimeMs) break;
    appliedEvents.push(ev);

    switch (ev.event_type) {
      case 'data_sent':
        sender.state = ev.is_retransmission ? 'Retransmitting' : 'Waiting for ACK';
        sender.currentMessage = ev.message_id;
        sender.sequence = ev.sequence;
        sender.attempt = ev.attempt;
        sender.timerStartMs = ev.time_ms;
        metrics.transmissions++;
        if (ev.is_retransmission) metrics.retransmissions++;
        break;

      case 'data_arrived':
        if (ev.accepted) {
          receiver.state = 'Frame Accepted';
          receiver.lastReceivedSeq = ev.sequence;
          receiver.lastOutcome = 'accepted';
          receiver.expectedSeq = ev.new_expected_seq ?? (ev.sequence! ^ 1);
          pendingAcks++;
        } else {
          receiver.state = 'Duplicate Discarded';
          receiver.lastReceivedSeq = ev.sequence;
          receiver.lastOutcome = 'duplicate';
          metrics.duplicates++;
          pendingAcks++;
        }
        break;

      case 'payload_delivered':
        metrics.delivered++;
        receiver.uniqueDelivered++;
        break;

      case 'ack_scheduled':
        if(ev.ack_send_time!==undefined)scheduledAcks.push(ev.ack_send_time);
        break;

      case 'ack_sent':
        scheduledAcks.shift();
        metrics.acksSent++;
        pendingAcks = Math.max(0, pendingAcks - 1);
        receiver.state = 'ACK Sent';
        break;

      case 'ack_accepted':
        // After ack_accepted, look ahead for transfer_complete to decide if state
        // goes to Complete or remains Waiting for ACK.
        // We'll set it to Waiting; transfer_complete event will correct to Complete.
        sender.state = 'Waiting for ACK';
        sender.timerStartMs = null;
        break;

      case 'transfer_complete':
        sender.state = 'Complete';
        metrics.completionTime = ev.complete_at ?? ev.time_ms;
        break;

      case 'timeout':
        // State will be updated by the next data_sent event
        break;

      default:
        break;
    }
  }

  receiver.pendingAcks = pendingAcks;
  receiver.nextAckTimeMs = scheduledAcks[0] ?? null;
  return { sender, receiver, metrics, inFlight, appliedEvents };
}

// ─── Find next event timestamp ────────────────────────────────────────────────

export function nextEventTime(events: SimEvent[], afterMs: number): number | null {
  const next = events.find(e => e.time_ms > afterMs);
  return next ? next.time_ms : null;
}

// ─── Get all events at a specific time ────────────────────────────────────────

export function eventsAtTime(events: SimEvent[], timeMs: number): SimEvent[] {
  return events.filter(e => e.time_ms === timeMs);
}
