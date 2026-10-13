import pytest
from simulator.protocol_lab import run_lab

@pytest.mark.parametrize('protocol',['sw','gbn','sr'])
@pytest.mark.parametrize('drop_data,drop_ack',[(0,0),(2,0),(0,1),(2,1),(6,6)])
def test_delivery_and_window(protocol,drop_data,drop_ack):
    r=run_lab(dict(protocol=protocol,drop_data=drop_data,drop_ack=drop_ack))
    assert r['delivered']==list(range(1,7))
    assert r['complete'] is not None
    assert r['stats']['data_lost']==bool(drop_data)
    assert r['stats']['acks_lost']==bool(drop_ack)
    for e in r['events']:
        assert len(e['delivered'])==len(set(e['delivered']))
        assert e['next_frame']-e['base']<=r['config']['window']
    assert [e['time'] for e in r['events']]==sorted(e['time'] for e in r['events'])

def test_selective_retry_vs_go_back_n():
    sr=run_lab(dict(protocol='sr',drop_data=2))
    gbn=run_lab(dict(protocol='gbn',drop_data=2))
    assert [e['frame'] for e in sr['events'] if e['kind']=='retry']==[2]
    assert gbn['stats']['retransmissions']>sr['stats']['retransmissions']
    assert any(e['buffer'] for e in sr['events'])
    assert not any(e['buffer'] for e in gbn['events'])

def test_ack_loss_creates_duplicate_in_stop_wait():
    r=run_lab(dict(protocol='sw',frames=1,drop_ack=1))
    assert r['stats']['duplicates']==1
    assert r['stats']['retransmissions']==1

@pytest.mark.parametrize('protocol',['sw','gbn','sr'])
def test_ack_wins_timeout_tie(protocol):
    r=run_lab(dict(protocol=protocol,timeout=1400))
    assert r['stats']['retransmissions']==0

@pytest.mark.parametrize('raw',[None,{}, {'frames':False},{'protocol':'invalid'},{'timeout':0},{'travel':float('nan')},{'drop_data':21}])
def test_validation(raw):
    if raw=={}: assert run_lab(raw)['complete'] is not None
    else:
        with pytest.raises(ValueError):run_lab(raw)

@pytest.mark.parametrize('protocol',['sw','gbn','sr'])
def test_short_timeout_does_not_duplicate_payload(protocol):
    r=run_lab(dict(protocol=protocol,timeout=200,ack_delay=700))
    assert r['delivered']==list(range(1,7))
    assert r['stats']['retransmissions']>0
