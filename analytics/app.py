from flask import Flask, request, jsonify
from analytics import analyze_inventory
from stock_analysis import analyze_stock

app = Flask(__name__)

# ─── Existing endpoint (kept as-is) ──────────────────────────────────────────

@app.route("/analytics/predict", methods=["POST"])
def predict():
    inventory = request.get_json()
    if not inventory or not isinstance(inventory, list):
        return jsonify({"success": False, "error": "Expected a JSON array of inventory items"}), 400
    result = analyze_inventory(inventory)
    return jsonify({"success": True, "data": result})

# ─── New stock analysis endpoint ─────────────────────────────────────────────

@app.route("/analytics/stock-analysis", methods=["POST"])
def stock_analysis():
    body = request.get_json()
    if not body or "items" not in body:
        return jsonify({"success": False, "error": "Expected { period_days, items: [...] }"}), 400

    period_days = body.get("period_days", 30)
    items       = body.get("items", [])

    if not isinstance(items, list) or len(items) == 0:
        return jsonify({"success": False, "error": "items must be a non-empty array"}), 400

    results, skipped = analyze_stock(items, period_days)
    return jsonify({"success": True, "data": results, "skipped": skipped})

# ─── Health check ─────────────────────────────────────────────────────────────

@app.route("/analytics/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(port=8000, debug=True)
