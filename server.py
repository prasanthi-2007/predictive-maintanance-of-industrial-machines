from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import json
import os

app = Flask(__name__)

# Load model artifacts
MODEL_PATH = 'ml_engine/models/predictive_maintenance_models.joblib'
METRICS_PATH = 'ml_engine/models/model_metrics.json'

models_loaded = False
clf = None
reg = None
feature_cols = []
classes = []
model_metrics = {}

if os.path.exists(MODEL_PATH):
    try:
        pkg = joblib.load(MODEL_PATH)
        clf = pkg['classifier']
        reg = pkg['regressor']
        feature_cols = pkg['feature_cols']
        classes = pkg['classes']
        models_loaded = True
        print("Successfully loaded ML models in Flask backend.")
    except Exception as e:
        print(f"Error loading models: {e}")

if os.path.exists(METRICS_PATH):
    with open(METRICS_PATH, 'r') as f:
        model_metrics = json.load(f)

# Machine fleet state cache
FLEET_MACHINES = [
    {"id": "MACH-001", "name": "CNC Milling Spindle Alpha", "type": "CNC Lathe", "location": "Sector A-1", "hours": 4250, "base_temp": 52.0, "base_vib": 1.4, "base_press": 88.0, "status": "Normal"},
    {"id": "MACH-002", "name": "Heavy Hydraulic Press 500T", "type": "Hydraulic Press", "location": "Sector B-3", "hours": 8100, "base_temp": 64.0, "base_vib": 2.1, "base_press": 1420.0, "status": "Normal"},
    {"id": "MACH-003", "name": "Main Turbine Generator 02", "type": "Turbine Generator", "location": "Sector C-4", "hours": 9400, "base_temp": 71.0, "base_vib": 3.8, "base_press": 92.0, "status": "Warning"},
    {"id": "MACH-004", "name": "Primary Assembly Line Conveyor", "type": "Conveyor Drive", "location": "Sector A-4", "hours": 2100, "base_temp": 44.0, "base_vib": 1.1, "base_press": 84.0, "status": "Normal"},
    {"id": "MACH-005", "name": "CNC Lathe High Precision Beta", "type": "CNC Lathe", "location": "Sector A-2", "hours": 5800, "base_temp": 82.0, "base_vib": 7.5, "base_press": 85.0, "status": "Critical"},
    {"id": "MACH-006", "name": "Secondary Hydraulic Stamp Press", "type": "Hydraulic Press", "location": "Sector B-1", "hours": 3400, "base_temp": 48.0, "base_vib": 1.3, "base_press": 720.0, "status": "Warning"}
]

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,DELETE,OPTIONS'
    return response

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "name": "ApexPredict AI Backend Server",
        "status": "online",
        "frontend_app": "http://localhost:5173/",
        "api_endpoints": {
            "health": "/api/health",
            "metrics": "/api/metrics",
            "fleet": "/api/fleet",
            "upload": "/api/upload",
            "predict": "/api/predict"
        }
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "models_loaded": models_loaded,
        "features": feature_cols,
        "classes": classes
    })

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    return jsonify(model_metrics)

@app.route('/api/fleet', methods=['GET'])
def get_fleet():
    return jsonify(FLEET_MACHINES)

@app.route('/api/upload', methods=['GET', 'POST', 'DELETE'])
def upload_dataset():
    save_path = 'ml_engine/data/sensor_telemetry.csv'
    
    if request.method == 'DELETE':
        if os.path.exists(save_path):
            os.remove(save_path)
            return jsonify({
                "status": "success",
                "message": "Uploaded dataset CSV removed from server successfully."
            })
        return jsonify({
            "status": "info",
            "message": "No uploaded dataset CSV found on server."
        }), 200

    if request.method == 'GET':
        if os.path.exists(save_path):
            stat = os.stat(save_path)
            return jsonify({
                "saved_file_exists": True,
                "path": save_path,
                "size_bytes": stat.st_size,
                "last_modified": stat.st_mtime
            })
        return jsonify({"saved_file_exists": False, "message": "No dataset uploaded yet on server."})

    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    try:
        os.makedirs('ml_engine/data', exist_ok=True)
        file.save(save_path)

        # Trigger model retraining
        from ml_engine.train_predictive_model import train_and_evaluate
        train_and_evaluate()

        # Reload updated model artifacts into Flask memory
        global clf, reg, feature_cols, classes, models_loaded, model_metrics
        if os.path.exists(MODEL_PATH):
            pkg = joblib.load(MODEL_PATH)
            clf = pkg['classifier']
            reg = pkg['regressor']
            feature_cols = pkg['feature_cols']
            classes = pkg['classes']
            models_loaded = True

        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'r') as f:
                model_metrics = json.load(f)

        return jsonify({
            "status": "success",
            "message": f"Successfully uploaded '{file.filename}' to '{save_path}' and retrained ML models!",
            "models_loaded": models_loaded
        })
    except Exception as e:
        return jsonify({"error": f"Failed to process CSV dataset: {str(e)}"}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json or {}
    
    # Extract telemetry input or fallback to defaults
    try:
        op_hours = float(data.get('operating_hours', 4000))
        load_pct = float(data.get('load_percent', 75.0))
        temp = float(data.get('temperature', 55.0))
        vib = float(data.get('vibration', 1.5))
        vib_freq = float(data.get('vibration_freq', 60.0))
        press = float(data.get('pressure', 90.0))
        acoust = float(data.get('acoustic', 68.0))
        rpm = float(data.get('rpm', 3000))
    except (TypeError, ValueError) as e:
        return jsonify({"error": f"Invalid telemetry numeric input: {str(e)}"}), 400

    input_df = pd.DataFrame([{
        'operating_hours': op_hours,
        'load_percent': load_pct,
        'temperature': temp,
        'vibration': vib,
        'vibration_freq': vib_freq,
        'pressure': press,
        'acoustic': acoust,
        'rpm': rpm
    }])[feature_cols]

    if models_loaded and clf and reg:
        probs = clf.predict_proba(input_df)[0]
        pred_class = clf.predict(input_df)[0]
        prob_dict = {cls: round(float(p), 4) for cls, p in zip(clf.classes_, probs)}
        
        # Calculate Risk Index
        normal_prob = prob_dict.get('Normal', 1.0)
        failure_risk = round(1.0 - normal_prob, 4)
        
        pred_rul = float(reg.predict(input_df)[0])
        pred_rul = round(max(1.0, pred_rul), 1)
    else:
        # Fallback heuristic rules engine
        failure_risk = 0.05
        pred_class = 'Normal'
        if vib > 5.0 or temp > 80.0 or press < 500.0:
            failure_risk = 0.88
            pred_class = 'Bearing Wear' if vib > 6.0 else ('Overheating' if temp > 80.0 else 'Hydraulic Pressure Drop')
        prob_dict = {pred_class: failure_risk, 'Normal': 1.0 - failure_risk}
        pred_rul = 48.0 if failure_risk > 0.5 else 1200.0

    # Risk Tier classification
    if failure_risk < 0.20:
        risk_level = "Healthy"
        risk_color = "#10b981"
        action = "Continuous Monitoring. Routine inspection schedule active."
    elif failure_risk < 0.60:
        risk_level = "Attention"
        risk_color = "#f59e0b"
        action = "Schedule preventative inspection within 72 hours."
    elif failure_risk < 0.85:
        risk_level = "Warning"
        risk_color = "#f97316"
        action = "High degradation detected. Prepare replacement parts & maintenance window."
    else:
        risk_level = "Critical"
        risk_color = "#ef4444"
        action = "CRITICAL BREAKDOWN IMMINENT! Stop spindle/unit and initiate repair immediately."

    return jsonify({
        "predicted_failure_mode": pred_class,
        "failure_risk_score": failure_risk,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "predicted_rul_hours": pred_rul,
        "class_probabilities": prob_dict,
        "recommended_action": action,
        "input_telemetry": {
            "temperature": temp,
            "vibration": vib,
            "vibration_freq": vib_freq,
            "pressure": press,
            "acoustic": acoust,
            "rpm": rpm,
            "load_percent": load_pct,
            "operating_hours": op_hours
        }
    })

if __name__ == '__main__':
    print("Starting Predictive Maintenance Flask Server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
