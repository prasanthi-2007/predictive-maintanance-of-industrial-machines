import React, { useState, useEffect } from 'react';
import { predictSensorState } from '../utils/inference';
import { Cpu, Zap, ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle2, RotateCcw, Clock, Thermometer, Activity, Gauge, Volume2 } from 'lucide-react';

export default function FaultSandbox({ selectedMachine }) {
  const [sensors, setSensors] = useState({
    temperature: selectedMachine ? selectedMachine.temp : 55.0,
    vibration: selectedMachine ? selectedMachine.vib : 1.5,
    vibration_freq: 60.0,
    pressure: selectedMachine ? selectedMachine.base_press || 88.0 : 88.0,
    acoustic: 68.0,
    rpm: 3000.0,
    load_percent: 75.0,
    operating_hours: selectedMachine ? selectedMachine.hours : 4200.0
  });

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync sliders when selectedMachine changes
  useEffect(() => {
    if (selectedMachine) {
      setSensors(prev => ({
        ...prev,
        temperature: selectedMachine.temp,
        vibration: selectedMachine.vib,
        pressure: selectedMachine.base_press || 88.0,
        operating_hours: selectedMachine.hours
      }));
    }
  }, [selectedMachine]);

  // Run prediction whenever sensors change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    predictSensorState(sensors).then(res => {
      if (isMounted) {
        setPrediction(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [sensors]);

  const handleSliderChange = (field, val) => {
    setSensors(prev => ({ ...prev, [field]: parseFloat(val) }));
  };

  const applyPreset = (presetType) => {
    switch (presetType) {
      case 'bearing':
        setSensors(prev => ({ ...prev, vibration: 8.8, vibration_freq: 290.0, acoustic: 94.0, temperature: 68.0, rpm: 2850.0 }));
        break;
      case 'overheat':
        setSensors(prev => ({ ...prev, temperature: 98.0, acoustic: 88.0, vibration: 3.2, pressure: 82.0 }));
        break;
      case 'hydraulic':
        setSensors(prev => ({ ...prev, pressure: 380.0, temperature: 78.0, vibration: 2.8, acoustic: 76.0 }));
        break;
      case 'imbalance':
        setSensors(prev => ({ ...prev, vibration: 9.6, rpm: 2580.0, acoustic: 90.0, vibration_freq: 45.0 }));
        break;
      default: // Normal
        setSensors(prev => ({ ...prev, temperature: 52.0, vibration: 1.4, vibration_freq: 60.0, pressure: 90.0, acoustic: 66.0, rpm: 3000.0 }));
        break;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sandbox Header */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, rgba(37,99,235,0.06) 100%)', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Cpu size={24} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Real-Time Anomaly & Fault Simulation Sandbox
              </h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Adjust live sensor values or trigger fault presets to observe instant ML model risk scoring, failure mode classification, and Remaining Useful Life (RUL) predictions.
            </p>
          </div>
          <button 
            onClick={() => applyPreset('normal')}
            className="btn-outline" 
            style={{ fontSize: '0.85rem' }}
          >
            <RotateCcw size={14} /> Reset to Normal Baseline
          </button>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginRight: '8px' }}>
          Fault Simulation Presets:
        </span>
        <button onClick={() => applyPreset('normal')} className="btn-outline" style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#047857', fontSize: '0.8rem' }}>
          <CheckCircle2 size={14} /> Baseline Normal
        </button>
        <button onClick={() => applyPreset('bearing')} className="btn-outline" style={{ borderColor: 'rgba(2,132,199,0.4)', color: '#0284c7', fontSize: '0.8rem' }}>
          <Zap size={14} /> Bearing Micro-fracture
        </button>
        <button onClick={() => applyPreset('overheat')} className="btn-outline" style={{ borderColor: 'rgba(234,88,12,0.4)', color: '#ea580c', fontSize: '0.8rem' }}>
          <Thermometer size={14} /> Thermal Overheating
        </button>
        <button onClick={() => applyPreset('hydraulic')} className="btn-outline" style={{ borderColor: 'rgba(37,99,235,0.4)', color: '#2563eb', fontSize: '0.8rem' }}>
          <Gauge size={14} /> Hydraulic Seal Loss
        </button>
        <button onClick={() => applyPreset('imbalance')} className="btn-outline" style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626', fontSize: '0.8rem' }}>
          <Activity size={14} /> Rotor Imbalance
        </button>
      </div>

      {/* Two Column Layout: Sliders (Left) vs ML Prediction Output (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px' }}>
        
        {/* Sliders Panel */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Activity size={18} color="var(--color-primary)" /> Sensor Telemetry Controls
          </h3>

          {/* Temperature Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Temperature (°C)</span>
              <span style={{ fontWeight: '700', color: sensors.temperature > 75 ? '#dc2626' : '#ea580c' }}>{sensors.temperature}°C</span>
            </div>
            <input 
              type="range" min="20" max="120" step="0.5" 
              value={sensors.temperature} 
              onChange={(e) => handleSliderChange('temperature', e.target.value)} 
            />
          </div>

          {/* Vibration Velocity Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vibration Velocity (mm/s RMS)</span>
              <span style={{ fontWeight: '700', color: sensors.vibration > 4.5 ? '#dc2626' : '#0284c7' }}>{sensors.vibration} mm/s</span>
            </div>
            <input 
              type="range" min="0.1" max="15.0" step="0.1" 
              value={sensors.vibration} 
              onChange={(e) => handleSliderChange('vibration', e.target.value)} 
            />
          </div>

          {/* Vibration Frequency Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vibration Frequency Peak (Hz)</span>
              <span style={{ fontWeight: '700', color: '#0284c7' }}>{sensors.vibration_freq} Hz</span>
            </div>
            <input 
              type="range" min="10" max="450" step="5" 
              value={sensors.vibration_freq} 
              onChange={(e) => handleSliderChange('vibration_freq', e.target.value)} 
            />
          </div>

          {/* Hydraulic Pressure Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Hydraulic Pressure (PSI)</span>
              <span style={{ fontWeight: '700', color: '#2563eb' }}>{sensors.pressure} PSI</span>
            </div>
            <input 
              type="range" min="50" max="1600" step="10" 
              value={sensors.pressure} 
              onChange={(e) => handleSliderChange('pressure', e.target.value)} 
            />
          </div>

          {/* Acoustic Emission Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Acoustic Noise Emission (dB)</span>
              <span style={{ fontWeight: '700', color: '#9333ea' }}>{sensors.acoustic} dB</span>
            </div>
            <input 
              type="range" min="40" max="115" step="1" 
              value={sensors.acoustic} 
              onChange={(e) => handleSliderChange('acoustic', e.target.value)} 
            />
          </div>

          {/* Motor RPM Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Spindle / Motor Speed (RPM)</span>
              <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{sensors.rpm} RPM</span>
            </div>
            <input 
              type="range" min="1000" max="3600" step="20" 
              value={sensors.rpm} 
              onChange={(e) => handleSliderChange('rpm', e.target.value)} 
            />
          </div>
        </div>

        {/* ML Prediction Output Panel */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Zap size={18} color="var(--color-primary)" /> ML Model Real-Time Inference Output
          </h3>

          {prediction && (
            <>
              {/* Failure Mode Badge & Risk Level */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: `1px solid ${prediction.risk_color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>DIAGNOSED FAILURE MODE</span>
                  <span className="badge" style={{ background: `${prediction.risk_color}18`, color: prediction.risk_color, border: `1px solid ${prediction.risk_color}55` }}>
                    {prediction.risk_level}
                  </span>
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  {prediction.predicted_failure_mode}
                </div>
              </div>

              {/* Failure Risk Score Meter */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Breakdown Risk Score</span>
                  <span style={{ fontWeight: '700', color: prediction.risk_color, fontSize: '1.1rem' }}>
                    {(prediction.failure_risk_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${prediction.failure_risk_score * 100}%`,
                    background: `linear-gradient(90deg, #10b981, ${prediction.risk_color})`,
                    borderRadius: '5px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* RUL Hours Card */}
              <div style={{ display: 'flex', gap: '16px', background: 'rgba(2, 132, 199, 0.06)', border: '1px solid rgba(2, 132, 199, 0.25)', padding: '16px', borderRadius: '12px', alignItems: 'center' }}>
                <Clock size={32} color="#0284c7" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>ESTIMATED REMAINING USEFUL LIFE (RUL)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#0284c7' }}>
                    {prediction.predicted_rul_hours} Hours
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time window available before catastrophic failure</div>
                </div>
              </div>

              {/* Recommended Action */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '10px', borderLeft: `4px solid ${prediction.risk_color}` }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '4px' }}>RECOMMENDED MAINTENANCE ACTION:</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {prediction.recommended_action}
                </p>
              </div>

              {/* Class Probability Distribution */}
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>ML Confidence Class Probabilities:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(prediction.class_probabilities || {}).map(([cls, prob]) => (
                    <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
                      <span style={{ width: '150px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{cls}</span>
                      <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${prob * 100}%`, background: cls === prediction.predicted_failure_mode ? prediction.risk_color : '#94a3b8', borderRadius: '3px' }} />
                      </div>
                      <span style={{ width: '45px', textAlign: 'right', fontWeight: '600', color: 'var(--text-main)' }}>{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
