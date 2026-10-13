import random
from simulator import simulate,SimConfig

def test_deterministic_parameter_sweep():
    rng=random.Random(96)
    for _ in range(100):
        c=SimConfig(num_frames=rng.randint(1,20),data_travel_ms=rng.randint(1,300),ack_delay_ms=rng.randint(0,1000),ack_travel_ms=rng.randint(1,300),timeout_ms=rng.randint(80,1200))
        r=simulate(c)
        assert r.success
        assert r.metrics.unique_messages_delivered == c.num_frames
        assert len({d['message_id'] for d in r.delivered_messages}) == c.num_frames
        assert r.metrics.acks_accepted == c.num_frames
        assert r.metrics.total_data_transmissions == c.num_frames+r.metrics.retransmissions
        assert r.metrics.acks_sent == r.metrics.acks_accepted+r.metrics.acks_ignored
        times=[e.time_ms for e in r.events]
        assert times == sorted(times)
        assert simulate(c).to_dict() == r.to_dict()
