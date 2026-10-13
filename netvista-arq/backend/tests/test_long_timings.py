import pytest
from app import app
@pytest.mark.parametrize("value", [600000, 600001, 3600000])
def test_long_timing(value):
    response=app.test_client().post('/api/simulate',json=dict(num_frames=1,data_travel_ms=value,ack_delay_ms=value,ack_travel_ms=value,timeout_ms=value))
    assert response.status_code==200
    data=response.get_json()
    assert data['metrics']['transfer_complete_time_ms']==3*value
    assert data['metrics']['unique_messages_delivered']==1
    assert data['metrics']['retransmissions']==2
