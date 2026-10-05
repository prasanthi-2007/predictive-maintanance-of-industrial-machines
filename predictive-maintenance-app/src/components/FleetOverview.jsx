import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Wrench, Thermometer, Activity, Gauge, Play, Search, Filter } from 'lucide-react';

export default function FleetOverview({ machines, onSelectMachine, onInspectSandbox }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredMachines = machines.filter(m => {
    const matchesSearch = 
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Fleet Hero Banner */}
      <div className="glass-panel scanline-effect" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, rgba(37,99,235,0.06) 100%)', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
              Factory Equipment Fleet Matrix
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Real-time ML anomaly evaluation across monitored industrial assets. Early breakdown risk detection is active.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span className="badge badge-healthy"><ShieldCheck size={14} /> {machines.filter(m => m.status === 'Healthy').length} Healthy</span>
            <span className="badge badge-warning"><AlertTriangle size={14} /> {machines.filter(m => m.status === 'Warning').length} Warnings</span>
            <span className="badge badge-critical"><AlertOctagon size={14} /> {machines.filter(m => m.status === 'Critical').length} Critical</span>
          </div>
        </div>
      </div>

      {/* Machine Search & Status Filter Controls Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '10px', flex: '1', maxWidth: '420px' }}>
          <Search size={18} color="var(--text-dim)" />
          <input 
            type="text" 
            placeholder="Search machine ID, name, location, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', color: 'var(--text-main)' }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', marginRight: '4px' }}>Filter Status:</span>
          {['ALL', 'HEALTHY', 'WARNING', 'CRITICAL'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="btn-outline"
              style={{
                fontSize: '0.75rem',
                padding: '6px 12px',
                background: statusFilter === status ? 'var(--color-primary)' : '#ffffff',
                color: statusFilter === status ? '#ffffff' : 'var(--text-main)',
                borderColor: statusFilter === status ? 'var(--color-primary)' : '#cbd5e1'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Filtered Machines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredMachines.map(m => {
          let badgeClass = 'badge-healthy';
          let borderGlow = 'rgba(16, 185, 129, 0.35)';
          let Icon = ShieldCheck;

          if (m.status === 'Critical') {
            badgeClass = 'badge-critical';
            borderGlow = 'rgba(239, 68, 68, 0.45)';
            Icon = AlertOctagon;
          } else if (m.status === 'Warning') {
            badgeClass = 'badge-warning';
            borderGlow = 'rgba(249, 115, 22, 0.4)';
            Icon = AlertTriangle;
          } else if (m.status === 'Attention') {
            badgeClass = 'badge-attention';
            borderGlow = 'rgba(245, 158, 11, 0.35)';
          }

          return (
            <div 
              key={m.id}
              className="glass-panel"
              style={{
                padding: '20px',
                borderRadius: '16px',
                border: `1px solid ${borderGlow}`,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{m.id} • {m.location}</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '2px' }}>{m.name}</h3>
                  </div>
                  <span className={`badge ${badgeClass}`}>
                    <Icon size={12} /> {m.status}
                  </span>
                </div>

                {/* Machine Type */}
                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '16px' }}>
                  {m.type}
                </div>

                {/* Telemetry Quick Gauges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <Thermometer size={12} color="#ea580c" /> Temp
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: m.temp > 75 ? '#dc2626' : 'var(--text-main)', marginTop: '2px' }}>
                      {m.temp}°C
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <Activity size={12} color="#0284c7" /> Vib
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: m.vib > 5.0 ? '#dc2626' : 'var(--text-main)', marginTop: '2px' }}>
                      {m.vib} <span style={{ fontSize: '0.65rem' }}>mm/s</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      <Gauge size={12} color="#2563eb" /> RUL
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: m.rul < 100 ? '#dc2626' : '#059669', marginTop: '2px' }}>
                      {m.rul}h
                    </div>
                  </div>
                </div>

                {/* Risk Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Failure Risk Index</span>
                    <span style={{ fontWeight: '700', color: m.risk > 0.6 ? '#dc2626' : (m.risk > 0.3 ? '#d97706' : '#059669') }}>
                      {(m.risk * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${m.risk * 100}%`,
                      background: m.risk > 0.6 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #10b981, #0284c7)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => onSelectMachine(m)}
                  className="btn-outline" 
                  style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px', justifyContent: 'center' }}
                >
                  <Activity size={14} /> Telemetry
                </button>
                <button 
                  onClick={() => onInspectSandbox(m)}
                  className="btn-primary" 
                  style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px', justifyContent: 'center' }}
                >
                  <Play size={14} /> Simulate Fault
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
