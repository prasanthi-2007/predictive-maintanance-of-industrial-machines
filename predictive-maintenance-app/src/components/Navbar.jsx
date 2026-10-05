import React, { useState, useEffect } from 'react';
import { Activity, Cpu, ShieldAlert, Wrench, BarChart2, Layers, Server, Clock, Upload } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, fleetStats }) {
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTimeStr(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'fleet', label: 'Fleet Overview', icon: Layers },
    { id: 'telemetry', label: 'Sensor Telemetry', icon: Activity },
    { id: 'sandbox', label: 'Fault Sandbox', icon: Cpu },
    { id: 'upload', label: 'Saved Datasets & Upload', icon: Upload },
    { id: 'orders', label: 'Work Orders & ROI', icon: Wrench },
    { id: 'analytics', label: 'Model Analytics', icon: BarChart2 }
  ];

  return (
    <header className="glass-panel" style={{ borderRadius: '0 0 16px 16px', marginBottom: '24px', padding: '16px 28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            padding: '10px',
            borderRadius: '12px',
            boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Activity size={26} color="#ffffff" className="pulse-active" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #0f172a, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ApexPredict AI
              </h1>
              <span className="badge badge-healthy" style={{ fontSize: '0.65rem' }}>
                <Server size={10} /> ML Model Online
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Industrial Sensor Predictive Maintenance Platform
            </p>
          </div>
        </div>

        {/* Quick Fleet Metrics Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fleet Size</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#0f172a' }}>{fleetStats.total} Units</div>
          </div>
          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Warnings</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#d97706' }}>{fleetStats.warning}</div>
          </div>
          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Critical</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#dc2626' }}>{fleetStats.critical}</div>
          </div>
          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Saved (ROI)</div>
            <div style={{ fontSize: '1rem', fontWeight: '700', color: '#059669' }}>$100.8K</div>
          </div>
        </div>

        {/* Live Clock & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
          <Clock size={16} color="var(--color-primary)" />
          <span>{timeStr}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '8px', marginTop: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: isActive ? 'linear-gradient(135deg, rgba(2,132,199,0.1) 0%, rgba(37,99,235,0.1) 100%)' : 'transparent',
                color: isActive ? '#0284c7' : 'var(--text-muted)',
                boxShadow: isActive ? 'inset 0 0 12px rgba(2,132,199,0.12)' : 'none',
                borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent'
              }}
            >
              <Icon size={18} color={isActive ? '#0284c7' : 'var(--text-dim)'} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
