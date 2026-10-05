import React, { useState } from 'react';
import Navbar from './components/Navbar';
import FleetOverview from './components/FleetOverview';
import SensorTelemetry from './components/SensorTelemetry';
import FaultSandbox from './components/FaultSandbox';
import DatasetUpload from './components/DatasetUpload';
import WorkOrders from './components/WorkOrders';
import ModelAnalytics from './components/ModelAnalytics';

export default function App() {
  const [activeTab, setActiveTab] = useState('fleet');

  const DEFAULT_MACHINES = [
    { id: 'MACH-001', name: 'CNC Milling Spindle Alpha', type: 'CNC Lathe', location: 'Sector A-1', hours: 4250, temp: 52.0, vib: 1.4, base_press: 88.0, status: 'Healthy', risk: 0.05, rul: 1850 },
    { id: 'MACH-002', name: 'Heavy Hydraulic Press 500T', type: 'Hydraulic Press', location: 'Sector B-3', hours: 8100, temp: 64.0, vib: 2.1, base_press: 1420.0, status: 'Healthy', risk: 0.08, rul: 1420 },
    { id: 'MACH-003', name: 'Main Turbine Generator 02', type: 'Turbine Generator', location: 'Sector C-4', hours: 9400, temp: 71.0, vib: 3.8, base_press: 92.0, status: 'Warning', risk: 0.62, rul: 120 },
    { id: 'MACH-004', name: 'Primary Assembly Line Conveyor', type: 'Conveyor Drive', location: 'Sector A-4', hours: 2100, temp: 44.0, vib: 1.1, base_press: 84.0, status: 'Healthy', risk: 0.02, rul: 2100 },
    { id: 'MACH-005', name: 'CNC Lathe High Precision Beta', type: 'CNC Lathe', location: 'Sector A-2', hours: 5800, temp: 84.0, vib: 7.8, base_press: 85.0, status: 'Critical', risk: 0.94, rul: 8.5 },
    { id: 'MACH-006', name: 'Secondary Hydraulic Stamp Press', type: 'Hydraulic Press', location: 'Sector B-1', hours: 3400, temp: 48.0, vib: 1.3, base_press: 480.0, status: 'Warning', risk: 0.58, rul: 48 }
  ];

  const [machines, setMachines] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_fleet_machines');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load fleet from localStorage', e);
    }
    return DEFAULT_MACHINES;
  });

  const [selectedMachine, setSelectedMachine] = useState(machines[0] || DEFAULT_MACHINES[0]);

  // Sync fleet machines to localStorage on change
  React.useEffect(() => {
    try {
      localStorage.setItem('apex_fleet_machines', JSON.stringify(machines));
    } catch (e) {
      console.error('Failed to save fleet to localStorage', e);
    }
  }, [machines]);

  const handleImportMachines = (newMachines) => {
    setMachines(prev => {
      // Merge unique by ID
      const existingIds = new Set(prev.map(m => m.id));
      const filteredNew = newMachines.filter(m => !existingIds.has(m.id));
      const updated = [...filteredNew, ...prev];
      return updated;
    });
  };

  const fleetStats = {
    total: machines.length,
    healthy: machines.filter(m => m.status === 'Healthy').length,
    warning: machines.filter(m => m.status === 'Warning' || m.status === 'Attention').length,
    critical: machines.filter(m => m.status === 'Critical').length
  };

  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
    setActiveTab('telemetry');
  };

  const handleInspectSandbox = (machine) => {
    setSelectedMachine(machine);
    setActiveTab('sandbox');
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 20px 40px 20px' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        fleetStats={fleetStats} 
      />

      <main>
        {activeTab === 'fleet' && (
          <FleetOverview 
            machines={machines} 
            onSelectMachine={handleSelectMachine}
            onInspectSandbox={handleInspectSandbox}
          />
        )}

        {activeTab === 'telemetry' && (
          <SensorTelemetry 
            selectedMachine={selectedMachine || machines[0]} 
            machines={machines}
            onMachineChange={setSelectedMachine}
          />
        )}

        {activeTab === 'sandbox' && (
          <FaultSandbox 
            selectedMachine={selectedMachine || machines[0]} 
          />
        )}

        {activeTab === 'upload' && (
          <DatasetUpload 
            onImportToFleet={handleImportMachines}
            onNavigateToFleet={() => setActiveTab('fleet')}
          />
        )}

        {activeTab === 'orders' && (
          <WorkOrders 
            machines={machines} 
          />
        )}

        {activeTab === 'analytics' && (
          <ModelAnalytics />
        )}
      </main>

      <footer style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
        <p>ApexPredict AI • Predictive Maintenance Operations & Machine Failure Prevention Platform</p>
        <p style={{ marginTop: '4px' }}>Undergraduate (UG) Case Study & Technical Prototype Submission</p>
      </footer>
    </div>
  );
}
