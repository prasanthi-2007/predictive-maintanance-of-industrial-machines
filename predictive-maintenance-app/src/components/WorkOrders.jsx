import React, { useState } from 'react';
import { Wrench, DollarSign, AlertOctagon, CheckCircle2, Clock, Package, FileText, ChevronRight } from 'lucide-react';

export default function WorkOrders({ machines }) {
  const [workOrders, setWorkOrders] = useState([
    {
      id: 'WO-9104',
      machineId: 'MACH-005',
      machineName: 'CNC Lathe High Precision Beta',
      failureMode: 'Bearing Wear & Micro-fracture',
      urgency: 'Critical',
      estHours: '2.5 hrs',
      sparePart: 'SKF 7210 Angular Contact Bearing Set',
      partCost: 850,
      laborCost: 450,
      downtimeSaved: 35200,
      status: 'Dispatch Pending'
    },
    {
      id: 'WO-9102',
      machineId: 'MACH-003',
      machineName: 'Main Turbine Generator 02',
      failureMode: 'Rotor Imbalance & Thermal Drift',
      urgency: 'Warning',
      estHours: '4.0 hrs',
      sparePart: 'Dynamic Alignment Shim & Coupling Kit',
      partCost: 1200,
      laborCost: 600,
      downtimeSaved: 48000,
      status: 'Parts Reserved'
    },
    {
      id: 'WO-9088',
      machineId: 'MACH-006',
      machineName: 'Secondary Hydraulic Stamp Press',
      failureMode: 'Hydraulic Pressure Drop',
      urgency: 'Warning',
      estHours: '3.0 hrs',
      sparePart: 'Viton High-Pressure Hydraulic Seal Pack',
      partCost: 420,
      laborCost: 450,
      downtimeSaved: 28600,
      status: 'In Progress'
    }
  ]);

  const [selectedWO, setSelectedWO] = useState(workOrders[0]);

  const totalSavings = workOrders.reduce((sum, wo) => sum + (wo.downtimeSaved - (wo.partCost + wo.laborCost)), 0);

  const approveWO = (id) => {
    setWorkOrders(prev => prev.map(w => w.id === id ? { ...w, status: 'Approved & Dispatched' } : w));
    if (selectedWO && selectedWO.id === id) {
      setSelectedWO(prev => ({ ...prev, status: 'Approved & Dispatched' }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Financial ROI Hero Banner */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(37,99,235,0.08) 100%)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <DollarSign size={26} color="#059669" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Predictive Maintenance Financial ROI Engine
              </h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Comparing AI-assisted preventative repairs vs unplanned catastrophic breakdown costs across your factory floor.
            </p>
          </div>

          <div style={{ background: '#ffffff', padding: '16px 24px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.3)', textAlign: 'right', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>TOTAL NET COST SAVINGS</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#059669' }}>
              ${(totalSavings).toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>97.5% Avg Cost Reduction / Incident</div>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Comparison Table */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>
          Cost Impact Matrix: Predictive Repair vs Catastrophic Breakdown
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Cost Factor Category</th>
                <th style={{ padding: '12px', color: '#dc2626' }}>Catastrophic Unplanned Failure</th>
                <th style={{ padding: '12px', color: '#059669' }}>ApexPredict AI Preventative Repair</th>
                <th style={{ padding: '12px', color: '#0284c7' }}>Net Financial Benefit</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Replacement Hardware / Assembly</td>
                <td style={{ padding: '12px', color: '#dc2626' }}>$12,500 (Full Spindle Failure)</td>
                <td style={{ padding: '12px', color: '#059669' }}>$850 (Single Bearing Pack)</td>
                <td style={{ padding: '12px', color: '#0284c7', fontWeight: '600' }}>Save $11,650</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Labor & Emergency Service Fees</td>
                <td style={{ padding: '12px', color: '#dc2626' }}>$4,000 (Emergency Specialist)</td>
                <td style={{ padding: '12px', color: '#059669' }}>$450 (In-house Off-Shift Tech)</td>
                <td style={{ padding: '12px', color: '#0284c7', fontWeight: '600' }}>Save $3,550</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Lost Production Downtime (32h vs 0h)</td>
                <td style={{ padding: '12px', color: '#dc2626' }}>$35,200 (@ $1,100/hr halt)</td>
                <td style={{ padding: '12px', color: '#059669' }}>$0 (Scheduled Maintenance Window)</td>
                <td style={{ padding: '12px', color: '#0284c7', fontWeight: '600' }}>Save $35,200</td>
              </tr>
              <tr style={{ fontWeight: '700', fontSize: '0.95rem' }}>
                <td style={{ padding: '12px', color: 'var(--text-main)' }}>TOTAL COST PER INCIDENT</td>
                <td style={{ padding: '12px', color: '#dc2626' }}>$51,700</td>
                <td style={{ padding: '12px', color: '#059669' }}>$1,300</td>
                <td style={{ padding: '12px', color: '#059669' }}>+$50,400 per Incident</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Work Orders Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* Work Order List */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--color-primary)" /> Automated Maintenance Work Orders
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workOrders.map(wo => {
              const isSelected = selectedWO.id === wo.id;
              return (
                <div 
                  key={wo.id}
                  onClick={() => setSelectedWO(wo)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(2,132,199,0.08)' : '#f8fafc',
                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{wo.id} • {wo.machineId}</span>
                    <span className={`badge ${wo.urgency === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                      {wo.urgency}
                    </span>
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
                    {wo.machineName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '500', marginTop: '2px' }}>
                    Diagnosed: {wo.failureMode}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>Est Labor: {wo.estHours}</span>
                    <span style={{ color: wo.status.includes('Approved') ? '#059669' : '#d97706', fontWeight: '600' }}>
                      {wo.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Work Order Details & Action */}
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>WORK ORDER DETAILS</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-main)' }}>{selectedWO.id}</h3>
              </div>
              <span className={`badge ${selectedWO.urgency === 'Critical' ? 'badge-critical' : 'badge-warning'}`}>
                {selectedWO.status}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-dim)' }}>Target Machine:</span>
                <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{selectedWO.machineName} ({selectedWO.machineId})</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-dim)' }}>ML Diagnostic Root Cause:</span>
                <div style={{ color: '#dc2626', fontWeight: '600' }}>{selectedWO.failureMode}</div>
              </div>

              <div>
                <span style={{ color: 'var(--text-dim)' }}>Recommended Replacement Spare Part:</span>
                <div style={{ color: '#0284c7', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={14} /> {selectedWO.sparePart}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Part + Labor Cost:</span>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)' }}>${selectedWO.partCost + selectedWO.laborCost}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Downtime Loss Prevented:</span>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#059669' }}>${selectedWO.downtimeSaved.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => approveWO(selectedWO.id)}
              disabled={selectedWO.status.includes('Approved')}
              className="btn-primary" 
              style={{
                width: '100%',
                justify: 'center',
                padding: '12px',
                opacity: selectedWO.status.includes('Approved') ? 0.6 : 1
              }}
            >
              <CheckCircle2 size={18} /> {selectedWO.status.includes('Approved') ? 'Dispatched to Technician' : 'Approve & Dispatch Maintenance Crew'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
