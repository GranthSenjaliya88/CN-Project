"""
backend/app.py
Flask application exposing the ARQ simulation JSON API.
"""

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

import sys, os
from pathlib import Path
sys.path.insert(0, os.path.dirname(__file__))

from simulator import simulate, SimConfig, validate_config, ValidationError

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "version": "1.0"})


@app.route("/api/simulate", methods=["POST"])
def run_simulation():
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"success": False, "error": "A JSON object is required.", "field": None}), 400

    try:
        nf, dt, ad, at, tmo = validate_config(body)
    except ValidationError as exc:
        return jsonify({"success": False, "error": exc.message, "field": exc.field}), 422

    cfg    = SimConfig(num_frames=nf, data_travel_ms=dt, ack_delay_ms=ad,
                       ack_travel_ms=at, timeout_ms=tmo)
    result = simulate(cfg)
    status = 200 if result.success else 422
    return jsonify(result.to_dict()), status


@app.route("/api/scenarios", methods=["GET"])
def scenarios():
    """Return the three reference scenario configurations."""
    return jsonify({
        "scenarios": [
            {
                "id": "normal",
                "label": "Normal Delivery",
                "description": "ACK arrives before timeout; no retransmission.",
                "config": {"num_frames": 1, "data_travel_ms": 100, "ack_delay_ms": 100,
                           "ack_travel_ms": 100, "timeout_ms": 800},
                "expected": {"total_data_transmissions": 1, "retransmissions": 0,
                             "duplicate_data_arrivals": 0, "transfer_complete_time_ms": 300},
            },
            {
                "id": "delayed",
                "label": "Delayed ACK",
                "description": "ACK arrives after timeout; retransmission occurs.",
                "config": {"num_frames": 1, "data_travel_ms": 100, "ack_delay_ms": 900,
                           "ack_travel_ms": 100, "timeout_ms": 600},
                "expected": {"total_data_transmissions": 2, "retransmissions": 1,
                             "duplicate_data_arrivals": 1, "transfer_complete_time_ms": 1100},
            },
            {
                "id": "adjusted",
                "label": "Adjusted Timeout",
                "description": "Longer timeout prevents unnecessary retransmission.",
                "config": {"num_frames": 1, "data_travel_ms": 100, "ack_delay_ms": 900,
                           "ack_travel_ms": 100, "timeout_ms": 1400},
                "expected": {"total_data_transmissions": 1, "retransmissions": 0,
                             "duplicate_data_arrivals": 0, "transfer_complete_time_ms": 1100},
            },
        ]
    })


@app.route('/api/protocol-lab', methods=['POST'])
def protocol_lab():
    from simulator.protocol_lab import run_lab
    try:
        return jsonify(run_lab(request.get_json(silent=True)))
    except ValueError as exc:
        return jsonify(error=str(exc)), 422


DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"

@app.route("/")
@app.route("/<path:route>")
def frontend(route=""):
    if route.startswith("api/"):
        return jsonify({"error": "Unknown API endpoint."}), 404
    if not (DIST / "index.html").is_file():
        return jsonify({"message": "Build the React frontend with npm run build, or use the Vite server on port 3000."}), 503
    candidate = (DIST / route).resolve()
    if route and candidate.is_relative_to(DIST.resolve()) and candidate.is_file():
        return send_from_directory(DIST, route)
    if Path(route).suffix:
        return jsonify({"error": "Asset not found."}), 404
    return send_from_directory(DIST, "index.html")

if __name__ == "__main__":
    app.run(host="127.0.0.1", debug=False, port=int(os.environ.get("PORT", "5000")), use_reloader=False)
