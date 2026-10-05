import modelMeta from '../data/model_metadata.json';

/**
 * Perform Machine Learning Prediction
 * Checks Flask API backend first; if unavailable, falls back to JS client-side inference logic.
 */
export async function predictSensorState(sensors) {
  const {
    temperature = 55.0,
    vibration = 1.5,
    vibration_freq = 60.0,
    pressure = 90.0,
    acoustic = 68.0,
    rpm = 3000.0,
    load_percent = 75.0,
    operating_hours = 4000.0
  } = sensors;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const response = await fetch('http://localhost:5000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        temperature, vibration, vibration_freq, pressure, acoustic, rpm, load_percent, operating_hours
      })
    });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    // API server offline or timed out; proceed with fast JS inference fallback
  }

  // --- CLIENT-SIDE EMBEDDED INFERENCE ENGINE ---
  let failureMode = 'Normal';
  let riskScore = 0.04;
  let rulHours = 1450.0;
  
  // 1. Evaluate Bearing Wear
  if (vibration > 4.5 || vibration_freq > 140.0 || acoustic > 85.0) {
    const vibImpact = Math.min(1.0, (vibration - 1.2) / 10.0);
    const freqImpact = Math.min(1.0, (vibration_freq - 60) / 300.0);
    riskScore = Math.min(0.99, 0.45 + vibImpact * 0.4 + freqImpact * 0.2);
    failureMode = 'Bearing Wear';
    rulHours = Math.max(2.0, 180.0 * (1 - riskScore));
  } 
  // 2. Evaluate Overheating
  else if (temperature > 72.0) {
    const tempImpact = Math.min(1.0, (temperature - 50.0) / 50.0);
    riskScore = Math.min(0.99, 0.35 + tempImpact * 0.55);
    failureMode = 'Overheating';
    rulHours = Math.max(4.0, 220.0 * (1 - riskScore));
  }
  // 3. Evaluate Hydraulic Pressure Drop
  else if (pressure < 600.0 && pressure > 10.0) {
    const pressDrop = Math.min(1.0, (1500.0 - pressure) / 1200.0);
    riskScore = Math.min(0.99, 0.40 + pressDrop * 0.55);
    failureMode = 'Hydraulic Pressure Drop';
    rulHours = Math.max(3.0, 150.0 * (1 - riskScore));
  }
  // 4. Evaluate Rotor Imbalance
  else if (vibration > 3.0 && rpm < 2850.0) {
    const imbImpact = Math.min(1.0, (vibration - 1.5) / 6.0);
    riskScore = Math.min(0.99, 0.30 + imbImpact * 0.5);
    failureMode = 'Rotor Imbalance';
    rulHours = Math.max(8.0, 300.0 * (1 - riskScore));
  }
  else {
    // Normal state with slight aging
    const hourAging = Math.min(0.15, operating_hours / 100000.0);
    riskScore = Math.min(0.18, 0.02 + hourAging);
    failureMode = 'Normal';
    rulHours = Math.max(400.0, 2400.0 - operating_hours * 0.1);
  }

  // Class probabilities payload
  const classProbs = {
    'Normal': failureMode === 'Normal' ? (1 - riskScore) : (1 - riskScore) * 0.1,
    'Bearing Wear': failureMode === 'Bearing Wear' ? riskScore : 0.01,
    'Overheating': failureMode === 'Overheating' ? riskScore : 0.01,
    'Hydraulic Pressure Drop': failureMode === 'Hydraulic Pressure Drop' ? riskScore : 0.01,
    'Rotor Imbalance': failureMode === 'Rotor Imbalance' ? riskScore : 0.01
  };

  let riskLevel = 'Healthy';
  let riskColor = '#10b981';
  let action = 'System operating within optimal parameters. Continuous telemetry monitoring active.';

  if (riskScore >= 0.80) {
    riskLevel = 'Critical';
    riskColor = '#ef4444';
    action = 'CRITICAL FAILURE IMMINENT! Stop machine immediately. Replace worn components before total lockup.';
  } else if (riskScore >= 0.50) {
    riskLevel = 'Warning';
    riskColor = '#f97316';
    action = 'High degradation level detected. Prepare replacement parts & schedule maintenance within 24h.';
  } else if (riskScore >= 0.20) {
    riskLevel = 'Attention';
    riskColor = '#f59e0b';
    action = 'Minor sensor anomaly detected. Flag for technician review during next shift inspection.';
  }

  return {
    predicted_failure_mode: failureMode,
    failure_risk_score: Math.round(riskScore * 1000) / 1000,
    risk_level: riskLevel,
    risk_color: riskColor,
    predicted_rul_hours: Math.round(rulHours * 10) / 10,
    class_probabilities: classProbs,
    recommended_action: action,
    input_telemetry: sensors
  };
}
