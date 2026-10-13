import pytest
from app import app

BASE = dict(num_frames=1, data_travel_ms=100, ack_delay_ms=100, ack_travel_ms=100, timeout_ms=800)

@pytest.mark.parametrize("value", [1.5, True, None, "abc", float("inf"), 0, 21])
def test_invalid_frame_count(value):
    response = app.test_client().post("/api/simulate", json={**BASE, "num_frames": value})
    assert response.status_code == 422
    assert response.json["field"] == "num_frames"

@pytest.mark.parametrize("value", [[1], "text", None, 2, True])
def test_invalid_body(value):
    assert app.test_client().post("/api/simulate", json=value).status_code == 400

@pytest.mark.parametrize("field", ["data_travel_ms", "ack_delay_ms", "ack_travel_ms", "timeout_ms"])
@pytest.mark.parametrize("value", [True, False, None, "", -1, float("nan"), float("inf"), 3600001])
def test_invalid_timings(field, value):
    r = app.test_client().post("/api/simulate", json={**BASE, field: value})
    assert r.status_code == 422
    assert r.json["field"] == field

@pytest.mark.parametrize("delay,timeout,transmissions,duplicates,completion,finish", [
    (100,800,1,0,300,300),(900,600,2,1,1100,1700),(900,1400,1,0,1100,1100),
    (900,1100,1,0,1100,1100),(900,1099,2,1,1100,2199)])
def test_reference_api(delay,timeout,transmissions,duplicates,completion,finish):
    r=app.test_client().post("/api/simulate",json={**BASE,"ack_delay_ms":delay,"timeout_ms":timeout})
    assert r.status_code == 200
    m=r.json["metrics"]
    assert (m["total_data_transmissions"],m["duplicate_data_arrivals"],m["transfer_complete_time_ms"],m["all_events_finish_ms"]) == (transmissions,duplicates,completion,finish)
    assert m["unique_messages_delivered"] == 1

def test_bounded_event_count():
    r=app.test_client().post("/api/simulate",json={**BASE,"ack_delay_ms":30000,"timeout_ms":0.001})
    assert r.status_code == 422
    assert "exceeded" in r.json["error"]


def test_production_spa_routes(tmp_path, monkeypatch):
    import importlib
    module=importlib.import_module("app")
    (tmp_path/"index.html").write_text("<title>React app</title>")
    (tmp_path/"asset.js").write_text("export default 1;")
    monkeypatch.setattr(module,"DIST",tmp_path)
    client=app.test_client()
    for route in ["/","/simulator","/experiments","/theory","/guide"]:
        assert client.get(route).status_code == 200
        assert b"React app" in client.get(route).data
    assert client.get("/asset.js").status_code == 200
    assert client.get("/missing.js").status_code == 404
    assert client.get("/api/unknown").status_code == 404

def test_production_missing_build(tmp_path, monkeypatch):
    import importlib
    monkeypatch.setattr(importlib.import_module("app"),"DIST",tmp_path)
    assert app.test_client().get("/").status_code == 503
