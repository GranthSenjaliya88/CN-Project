"""
app.py
Flask application serving the Stop-and-Wait ARQ Simulator.
"""

from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from simulator import simulate

app = Flask(__name__)
CORS(app)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/simulate", methods=["POST"])
def run_simulation():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "No JSON body provided."}), 400

    try:
        num_frames   = int(data.get("num_frames", 4))
        data_travel  = float(data.get("data_travel_ms", 100))
        ack_delay    = float(data.get("ack_delay_ms", 100))
        ack_travel   = float(data.get("ack_travel_ms", 100))
        timeout      = float(data.get("timeout_ms", 800))
    except (TypeError, ValueError) as e:
        return jsonify({"success": False, "error": f"Invalid parameter: {e}"}), 400

    # Validation
    errors = []
    if num_frames < 1 or num_frames > 20:
        errors.append("Number of frames must be between 1 and 20.")
    if data_travel <= 0:
        errors.append("Data travel time must be positive.")
    if ack_delay < 0:
        errors.append("ACK delay cannot be negative.")
    if ack_travel <= 0:
        errors.append("ACK travel time must be positive.")
    if timeout <= 0:
        errors.append("Timeout must be positive.")

    if errors:
        return jsonify({"success": False, "error": " ".join(errors)}), 400

    try:
        result = simulate(num_frames, data_travel, ack_delay, ack_travel, timeout)
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
