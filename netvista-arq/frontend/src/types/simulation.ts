// src/types/simulation.ts
// TypeScript type definitions matching the Python SimResult JSON schema

export type EventType =
  | 'data_sent'
  | 'data_arrived'
  | 'payload_delivered'
  | 'ack_scheduled'
  | 'ack_sent'
  | 'ack_arrived'
  | 'ack_accepted'
  | 'ack_ignored'
  | 'timeout'
  | 'duplicate_discarded'
  | 'transfer_complete';

export type Actor = 'SENDER' | 'RECEIVER' | 'CHANNEL';

export interface SimEvent {
  time_ms: number;
  event_type: EventType;
  actor: Actor;
  message_id: number | null;
  sequence: number | null;
  attempt: number | null;
  is_retransmission: boolean;
  description: string;
  // extra fields
  accepted?: boolean;
  duplicate?: boolean;
  stale?: boolean;
  for_duplicate?: boolean;
  arrive_at?: number;
  ack_send_time?: number;
  direction?: 'data' | 'ack';
  packet_label?: string;
  new_expected_seq?: number;
  complete_at?: number;
  timeout_ms?: number;
}

export interface AnimationHint {
  time_ms: number;
  anim_type: string;
  direction?: 'data' | 'ack';
  msg_id?: number;
  seq?: number;
  attempt?: number;
  is_retransmission?: boolean;
  arrive_at?: number;
  packet_label?: string;
  for_duplicate?: boolean;
  accepted?: boolean;
  stale?: boolean;
  complete_at?: number;
}

export interface SimConfig {
  num_frames: number;
  data_travel_ms: number;
  ack_delay_ms: number;
  ack_travel_ms: number;
  timeout_ms: number;
}

export interface SimMetrics {
  unique_messages_requested: number;
  unique_messages_delivered: number;
  total_data_transmissions: number;
  retransmissions: number;
  duplicate_data_arrivals: number;
  acks_sent: number;
  acks_accepted: number;
  acks_ignored: number;
  transfer_complete_time_ms: number | null;
  all_events_finish_ms: number | null;
}

export interface DeliveredMessage {
  message_id: number;
  seq: number;
  time_ms: number;
}

export interface SimResult {
  success: boolean;
  model_version: string;
  assumptions: string[];
  config: SimConfig;
  metrics: SimMetrics;
  events: SimEvent[];
  animation_hints: AnimationHint[];
  delivered_messages: DeliveredMessage[];
  error?: string;
}

// ─── Playback state ──────────────────────────────────────────────────────────

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete';

export interface PlaybackState {
  status: PlaybackStatus;
  currentTimeMs: number;
  totalTimeMs: number;
  speed: number;
  eventIndex: number;   // next event to process
  eventsApplied: SimEvent[];
}

// ─── Live state (derived from events during playback) ───────────────────────

export type SenderState = 'Ready' | 'Waiting for ACK' | 'Retransmitting' | 'Complete';
export type ReceiverState = 'Ready' | 'Frame Accepted' | 'Duplicate Discarded' | 'ACK Pending' | 'ACK Sent';

export interface LiveSenderState {
  state: SenderState;
  currentMessage: number | null;
  sequence: number | null;
  attempt: number | null;
  timeoutMs: number;
  timerStartMs: number | null;  // sim time when current timer started
}

export interface LiveReceiverState {
  state: ReceiverState;
  expectedSeq: number;
  lastReceivedSeq: number | null;
  lastOutcome: 'accepted' | 'duplicate' | null;
  pendingAcks: number;
  nextAckTimeMs: number | null;
  uniqueDelivered: number;
}

export interface LiveMetrics {
  transmissions: number;
  retransmissions: number;
  duplicates: number;
  delivered: number;
  acksSent: number;
  completionTime: number | null;
}

// ─── In-flight packet (for 3D scene) ─────────────────────────────────────────

export interface InFlightPacket {
  lost?: boolean;
  laneZ?: number;
  id: string;
  direction: 'data' | 'ack';
  seq: number;
  msgId: number;
  label: string;
  isRetransmission: boolean;
  forDuplicate: boolean;
  launchTimeMs: number;
  arriveTimeMs: number;
}

// ─── Scenario presets ─────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  label: string;
  description: string;
  config: SimConfig;
  expected: Partial<SimMetrics>;
}

// ─── Saved comparison run ────────────────────────────────────────────────────

export interface SavedRun {
  id: string;
  label: string;
  config: SimConfig;
  metrics: SimMetrics;
  timestamp: number;
}
