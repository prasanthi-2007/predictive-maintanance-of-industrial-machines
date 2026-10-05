import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Play, Pause, RefreshCw, AlertOctagon, Thermometer, Activity, Gauge, Volume2 } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SensorTelemetry({ selectedMachine, machines, onMachineChange }) {
  const [isStreaming, setIsStreaming] = useState(true);
  const [updateInterval, setUpdateInterval] = useState(1500);
  const [history, setHistory] = useState(() => {
    // Generate initial historical timeline points
    const labels = [];
    const temp = [];
    const vib = [];
    const press = [];
    const acoustic = [];

    const baseTemp = selectedMachine ? selectedMachine.temp : 54.0;
    const baseVib = selectedMachine ? selectedMachine.vib : 1.6;
    const basePress = selectedMachine ? selectedMachine.base_press || 88.0 : 88.0;

    for (let i = 20; i >= 0; i--) {
      const now = new Date(Date.now() - i * 2000);
      labels.push(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      temp.push(baseTemp + (Math.random() - 0.5) * 2.5);
      vib.push(Math.max(0.2, baseVib + (Math.random() - 0.5) * 0.4));
      press.push(basePress + (Math.random() - 0.5) * 3.0);
      acoustic.push(66.0 + (Math.random() - 0.5) * 3.5);
    }
    return { labels, temp, vib, press, acoustic };
  });

  // Streaming ticker loop
  useEffect(() => {
    if (!isStreaming) return;

    const timer = setInterval(() => {
      setHistory(prev => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newLabels = [...prev.labels.slice(1), now];

        const lastTemp = prev.temp[prev.temp.length - 1];
        const lastVib = prev.vib[prev.vib.length - 1];
        const lastPress = prev.press[prev.press.length - 1];
        const lastAcoustic = prev.acoustic[prev.acoustic.length - 1];

        // Random walk sensor movement
        const nextTemp = Math.max(20, Math.min(110, lastTemp + (Math.random() - 0.48) * 1.2));
        const nextVib = Math.max(0.1, Math.min(15, lastVib + (Math.random() - 0.48) * 0.25));
        const nextPress = Math.max(10, Math.min(2000, lastPress + (Math.random() - 0.5) * 2.0));
        const nextAcoustic = Math.max(40, Math.min(120, lastAcoustic + (Math.random() - 0.48) * 0.8));

        return {
          labels: newLabels,
          temp: [...prev.temp.slice(1), Math.round(nextTemp * 10) / 10],
          vib: [...prev.vib.slice(1), Math.round(nextVib * 100) / 100],
          press: [...prev.press.slice(1), Math.round(nextPress * 10) / 10],
          acoustic: [...prev.acoustic.slice(1), Math.round(nextAcoustic * 10) / 10]
        };
      });
    }, updateInterval);

    return () => clearInterval(timer);
  }, [isStreaming, updateInterval]);

  const triggerAnomalySpike = () => {
    setHistory(prev => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        labels: [...prev.labels.slice(1), now],
        temp: [...prev.temp.slice(1), Math.round((prev.temp[prev.temp.length - 1] + 18.5) * 10) / 10],
        vib: [...prev.vib.slice(1), Math.round((prev.vib[prev.vib.length - 1] + 4.2) * 100) / 100],
        press: [...prev.press.slice(1), Math.round(prev.press[prev.press.length - 1] * 0.7)],
        acoustic: [...prev.acoustic.slice(1), Math.round((prev.acoustic[prev.acoustic.length - 1] + 16.0) * 10) / 10]
      };
    });
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.06)' },
        ticks: { color: '#64748b', font: { size: 10 } }
      }
    },
    plugins: {
      legend: { labels: { color: '#0f172a', font: { size: 12, weight: '600' } } }
    }
  };

  const chartDataTemp = {
    labels: history.labels,
    datasets: [{
      label: 'Temperature (°C)',
      data: history.temp,
      borderColor: '#ea580c',
      backgroundColor: 'rgba(234, 88, 12, 0.12)',
      fill: true,
      tension: 0.3,
      borderWidth: 2
    }]
  };

  const chartDataVib = {
    labels: history.labels,
    datasets: [{
      label: 'Vibration Speed (mm/s RMS)',
      data: history.vib,
      borderColor: '#0284c7',
      backgroundColor: 'rgba(2, 132, 199, 0.12)',
      fill: true,
      tension: 0.3,
      borderWidth: 2
    }]
  };

  const chartDataPress = {
    labels: history.labels,
    datasets: [{
      label: 'Pressure (PSI)',
      data: history.press,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.12)',
      fill: true,
      tension: 0.3,
      borderWidth: 2
    }]
  };

  const chartDataAcoustic = {
    labels: history.labels,
    datasets: [{
      label: 'Acoustic Emission (dB)',
      data: history.acoustic,
      borderColor: '#9333ea',
      backgroundColor: 'rgba(147, 51, 234, 0.12)',
      fill: true,
      tension: 0.3,
      borderWidth: 2
    }]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Controls Bar */}
      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Select Target Machine:</label>
          <select 
            value={selectedMachine ? selectedMachine.id : machines[0].id}
            onChange={(e) => {
              const m = machines.find(item => item.id === e.target.value);
              if (m) onMachineChange(m);
            }}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              padding: '8px 14px',
              borderRadius: '8px',
              fontWeight: '600'
            }}
          >
            {machines.map(m => (
              <option key={m.id} value={m.id}>{m.id} - {m.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setIsStreaming(!isStreaming)}
            className="btn-outline"
            style={{ fontSize: '0.85rem' }}
          >
            {isStreaming ? <><Pause size={14} color="#d97706" /> Pause Stream</> : <><Play size={14} color="#059669" /> Resume Stream</>}
          </button>
          
          <button 
            onClick={triggerAnomalySpike}
            className="btn-outline"
            style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#dc2626', fontSize: '0.85rem' }}
          >
            <AlertOctagon size={14} /> Inject Telemetry Spike
          </button>
        </div>
      </div>

      {/* Sensor Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px' }}>
        
        {/* Temperature Chart */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Thermometer size={20} color="#f97316" />
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Thermal Profile (°C)</h3>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f97316' }}>
              {history.temp[history.temp.length - 1]}°C
            </span>
          </div>
          <div style={{ height: '220px' }}>
            <Line data={chartDataTemp} options={commonOptions} />
          </div>
        </div>

        {/* Vibration Chart */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#06b6d4" />
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Vibration Velocity (mm/s RMS)</h3>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#06b6d4' }}>
              {history.vib[history.vib.length - 1]} mm/s
            </span>
          </div>
          <div style={{ height: '220px' }}>
            <Line data={chartDataVib} options={commonOptions} />
          </div>
        </div>

        {/* Pressure Chart */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={20} color="#3b82f6" />
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Hydraulic Oil Pressure (PSI)</h3>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#3b82f6' }}>
              {history.press[history.press.length - 1]} PSI
            </span>
          </div>
          <div style={{ height: '220px' }}>
            <Line data={chartDataPress} options={commonOptions} />
          </div>
        </div>

        {/* Acoustic Chart */}
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={20} color="#a855f7" />
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Acoustic Emissions (dB)</h3>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#a855f7' }}>
              {history.acoustic[history.acoustic.length - 1]} dB
            </span>
          </div>
          <div style={{ height: '220px' }}>
            <Line data={chartDataAcoustic} options={commonOptions} />
          </div>
        </div>

      </div>
    </div>
  );
}
