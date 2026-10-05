import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, AlertOctagon, Download, 
  Play, RefreshCw, Cpu, Database, Search, Trash2, FolderCheck, ArrowRight, 
  Save, HardDrive, Eye, PlusCircle, Sliders, ShieldCheck, Thermometer, Activity, Gauge, Volume2
} from 'lucide-react';
import { predictSensorState } from '../utils/inference';

export default function DatasetUpload({ onImportToFleet, onNavigateToFleet }) {
  const [activeUploadTab, setActiveUploadTab] = useState('csv'); // 'csv' or 'single'
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retrainStatus, setRetrainStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // Single Machine Form State
  const [singleMachine, setSingleMachine] = useState({
    id: 'MACH-201',
    name: 'Primary Cooling Pump Unit',
    type: 'Cooling Pump',
    location: 'Sector C-2',
    temperature: 65.5,
    vibration: 2.4,
    vibration_freq: 60.0,
    pressure: 95.0,
    acoustic: 70.0,
    rpm: 3200,
    load_percent: 75.0,
    operating_hours: 4500
  });

  const [singleResult, setSingleResult] = useState(null);

  // Saved Datasets State (persisted in localStorage)
  const [savedDatasets, setSavedDatasets] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_saved_datasets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load saved datasets from localStorage', e);
      return [];
    }
  });

  // Active dataset view - default to latest saved dataset if available!
  const [batchResults, setBatchResults] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_saved_datasets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0]; // Auto-load latest stored dataset on screen!
        }
      }
    } catch (e) {}
    return null;
  });

  // Sync saved datasets to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('apex_saved_datasets', JSON.stringify(savedDatasets));
    } catch (e) {
      console.error('Failed to persist saved datasets to localStorage', e);
    }
  }, [savedDatasets]);

  // Handle Drag & Drop / File Change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      processCSV(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      processCSV(droppedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // CSV Parser
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(',');
      if (currentline.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          const val = currentline[j].trim().replace(/^["']|["']$/g, '');
          obj[headers[j]] = isNaN(val) ? val : parseFloat(val);
        }
        data.push(obj);
      }
    }
    return data;
  };

  const processCSV = (fileToProcess) => {
    setIsProcessing(true);
    setRetrainStatus(null);
    setImportStatus(null);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const rows = parseCSVText(text);

        if (rows.length === 0) {
          alert('Failed to parse CSV file or CSV file is empty. Please check format.');
          setIsProcessing(false);
          return;
        }

        // Run ML Inference on parsed rows
        const evaluatedRows = await Promise.all(rows.map(async (row, idx) => {
          const telemetry = {
            temperature: row.temperature || row.temp || 55.0,
            vibration: row.vibration || row.vib || 1.5,
            vibration_freq: row.vibration_freq || row.freq || 60.0,
            pressure: row.pressure || row.press || 90.0,
            acoustic: row.acoustic || row.acoust || 68.0,
            rpm: row.rpm || 3000.0,
            load_percent: row.load_percent || row.load || 75.0,
            operating_hours: row.operating_hours || row.hours || 4000.0
          };

          const pred = await predictSensorState(telemetry);

          return {
            id: row.machine_id || row.id || `UP-${idx + 101}`,
            name: row.machine_name || row.name || `Uploaded Asset ${idx + 1}`,
            telemetry,
            prediction: pred
          };
        }));

        // Compute summary metrics
        const healthyCount = evaluatedRows.filter(r => r.prediction.risk_level === 'Healthy').length;
        const warningCount = evaluatedRows.filter(r => r.prediction.risk_level === 'Warning' || r.prediction.risk_level === 'Attention').length;
        const criticalCount = evaluatedRows.filter(r => r.prediction.risk_level === 'Critical').length;
        const avgRul = Math.round(evaluatedRows.reduce((sum, r) => sum + r.prediction.predicted_rul_hours, 0) / evaluatedRows.length);

        const modeCounts = {};
        evaluatedRows.forEach(r => {
          const mode = r.prediction.predicted_failure_mode;
          modeCounts[mode] = (modeCounts[mode] || 0) + 1;
        });

        const newResult = {
          id: Date.now().toString(),
          fileName: fileToProcess.name,
          uploadedAt: new Date().toLocaleString(),
          totalRecords: evaluatedRows.length,
          healthyCount,
          warningCount,
          criticalCount,
          avgRul,
          modeCounts,
          rows: evaluatedRows,
          rawCSV: text
        };

        setBatchResults(newResult);

        // --- AUTOMATIC PERSISTENCE: Save to LocalStorage ---
        setSavedDatasets(prev => {
          const filtered = prev.filter(d => d.fileName !== fileToProcess.name);
          return [newResult, ...filtered];
        });

        setRetrainStatus({
          savedLocal: true,
          message: `Dataset '${fileToProcess.name}' automatically saved to Browser Storage!`
        });

        // Automatically import into active fleet
        handleImportCurrentToFleet(newResult);

        // Backend sync if server online
        handleBackendUpload(fileToProcess);

      } catch (err) {
        console.error('Error processing CSV:', err);
        alert('An error occurred while evaluating the dataset CSV.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(fileToProcess);
  };

  // Process Single Machine Submission
  const handleSingleMachineSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setRetrainStatus(null);
    setImportStatus(null);

    try {
      const telemetry = {
        temperature: parseFloat(singleMachine.temperature) || 55.0,
        vibration: parseFloat(singleMachine.vibration) || 1.5,
        vibration_freq: parseFloat(singleMachine.vibration_freq) || 60.0,
        pressure: parseFloat(singleMachine.pressure) || 90.0,
        acoustic: parseFloat(singleMachine.acoustic) || 68.0,
        rpm: parseFloat(singleMachine.rpm) || 3000.0,
        load_percent: parseFloat(singleMachine.load_percent) || 75.0,
        operating_hours: parseFloat(singleMachine.operating_hours) || 4000.0
      };

      const pred = await predictSensorState(telemetry);

      const evaluatedSingle = {
        id: singleMachine.id.trim() || `MACH-${Math.floor(100 + Math.random() * 900)}`,
        name: singleMachine.name.trim() || 'Custom Monitored Unit',
        type: singleMachine.type || 'Custom Industrial Machine',
        location: singleMachine.location || 'Sector Single Input',
        telemetry,
        prediction: pred
      };

      setSingleResult(evaluatedSingle);

      // Create or update Single Submissions dataset
      const singleDatasetName = 'Single_Machine_Submissions.csv';
      const existingSingleDataset = savedDatasets.find(d => d.fileName === singleDatasetName);
      
      let updatedRows = [evaluatedSingle];
      if (existingSingleDataset && Array.isArray(existingSingleDataset.rows)) {
        // Filter out duplicate ID if already exists
        const remaining = existingSingleDataset.rows.filter(r => r.id !== evaluatedSingle.id);
        updatedRows = [evaluatedSingle, ...remaining];
      }

      const healthyCount = updatedRows.filter(r => r.prediction.risk_level === 'Healthy').length;
      const warningCount = updatedRows.filter(r => r.prediction.risk_level === 'Warning' || r.prediction.risk_level === 'Attention').length;
      const criticalCount = updatedRows.filter(r => r.prediction.risk_level === 'Critical').length;
      const avgRul = Math.round(updatedRows.reduce((sum, r) => sum + r.prediction.predicted_rul_hours, 0) / updatedRows.length);

      const updatedDatasetObj = {
        id: existingSingleDataset ? existingSingleDataset.id : Date.now().toString(),
        fileName: singleDatasetName,
        uploadedAt: new Date().toLocaleString(),
        totalRecords: updatedRows.length,
        healthyCount,
        warningCount,
        criticalCount,
        avgRul,
        modeCounts: {},
        rows: updatedRows
      };

      setSavedDatasets(prev => {
        const filtered = prev.filter(d => d.fileName !== singleDatasetName);
        return [updatedDatasetObj, ...filtered];
      });

      setBatchResults(updatedDatasetObj);

      // Automatically import machine to Fleet matrix
      const machineForFleet = {
        id: evaluatedSingle.id,
        name: evaluatedSingle.name,
        type: evaluatedSingle.type,
        location: evaluatedSingle.location,
        hours: telemetry.operating_hours,
        temp: telemetry.temperature,
        vib: telemetry.vibration,
        base_press: telemetry.pressure,
        status: pred.risk_level,
        risk: pred.failure_risk_score,
        rul: pred.predicted_rul_hours
      };

      if (onImportToFleet) {
        onImportToFleet([machineForFleet]);
      }

      setRetrainStatus({
        success: true,
        message: `Machine '${evaluatedSingle.name}' (${evaluatedSingle.id}) evaluated and saved to Browser Storage & Fleet Matrix!`
      });

    } catch (err) {
      console.error('Error submitting single machine data:', err);
      alert('Failed to evaluate single machine telemetry.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Backend upload helper
  const handleBackendUpload = async (fileToUpload) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const formData = new FormData();
      formData.append('file', fileToUpload);

      const res = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        signal: controller.signal,
        body: formData
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok) {
        setRetrainStatus(prev => ({
          ...prev,
          success: true,
          message: `Saved to Local Storage & synced with Backend Python Server! (${data.message || 'Models retrained'})`
        }));
      } else {
        setRetrainStatus(prev => ({
          ...prev,
          warning: true,
          message: `Saved to Local Storage. Backend server warning: ${data.error}`
        }));
      }
    } catch (err) {
      setRetrainStatus(prev => ({
        ...prev,
        info: true,
        message: `Saved to Local Storage! (Backend server offline at http://localhost:5000)`
      }));
    }
  };

  // Manual Trigger for Backend Upload & Retrain
  const handleUploadAndRetrain = async () => {
    if (!file) {
      alert('Please select or upload a CSV file first.');
      return;
    }
    setRetrainStatus({ loading: true, message: 'Uploading CSV to backend server and retraining ML models...' });
    await handleBackendUpload(file);
  };

  // Import Current Batch Records to Active Fleet Matrix
  const handleImportCurrentToFleet = (resultsToImport = batchResults) => {
    if (!resultsToImport || !resultsToImport.rows) return;

    const formattedMachines = resultsToImport.rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type || (r.prediction.predicted_failure_mode !== 'Normal' ? `Anomaly: ${r.prediction.predicted_failure_mode}` : 'CSV Telemetry Asset'),
      location: r.location || 'Uploaded Batch',
      hours: r.telemetry.operating_hours,
      temp: r.telemetry.temperature,
      vib: r.telemetry.vibration,
      base_press: r.telemetry.pressure,
      status: r.prediction.risk_level,
      risk: r.prediction.failure_risk_score,
      rul: r.prediction.predicted_rul_hours
    }));

    if (onImportToFleet) {
      onImportToFleet(formattedMachines);
      setImportStatus({
        success: true,
        message: `Successfully saved & imported ${formattedMachines.length} records into Fleet Matrix!`
      });
    }
  };

  // Download Sample Template CSV
  const downloadSampleCSV = () => {
    const sampleHeader = "machine_id,machine_name,operating_hours,load_percent,temperature,vibration,vibration_freq,pressure,acoustic,rpm\n";
    const sampleRows = [
      "MACH-101,CNC Spindle Motor,4200,75.0,52.5,1.4,60.0,88.0,68.0,3000",
      "MACH-102,Hydraulic Press Main,8100,85.0,78.2,3.8,45.0,420.0,76.0,1450",
      "MACH-103,Turbine Rotor Unit,9400,90.0,94.5,8.8,280.0,92.0,92.0,3600",
      "MACH-104,Conveyor Drive Motor,2100,60.0,44.0,1.1,60.0,84.0,65.0,3000",
      "MACH-105,Precision Mill Beta,5800,95.0,86.0,9.2,320.0,85.0,95.0,2850"
    ].join("\n");

    const blob = new Blob([sampleHeader + sampleRows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'sample_sensor_telemetry.csv');
    a.click();
  };

  // Download Evaluated Dataset JSON
  const exportEvaluatedDataset = (dataset) => {
    const jsonStr = JSON.stringify(dataset, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `${dataset.fileName.replace(/\.csv$/i, '')}_evaluated_results.json`);
    a.click();
  };

  // Delete a saved dataset from Local Storage & Backend
  const handleDeleteSavedDataset = async (idToDelete) => {
    if (window.confirm('Are you sure you want to remove this saved dataset?')) {
      const updated = savedDatasets.filter(d => d.id !== idToDelete);
      setSavedDatasets(updated);
      if (batchResults && batchResults.id === idToDelete) {
        setBatchResults(updated.length > 0 ? updated[0] : null);
      }
      try {
        await fetch('http://localhost:5000/api/upload', { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend offline or unable to delete CSV from server', err);
      }
    }
  };

  // Load a saved dataset into view
  const handleLoadSavedDataset = (ds) => {
    setBatchResults(ds);
    setRetrainStatus({
      success: true,
      message: `Loaded stored dataset '${ds.fileName}' (${ds.totalRecords} records)`
    });
    setImportStatus(null);
  };

  // Filtered Rows for Table
  const filteredRows = batchResults?.rows.filter(r => 
    r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.prediction.predicted_failure_mode.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const displayedRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, rgba(37,99,235,0.06) 100%)', border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <HardDrive size={24} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Data Entry & Stored Datasets Repository
              </h2>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Upload full batch CSV telemetry files or manually enter single machine sensor data. All records are saved persistently and evaluated in real-time.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={downloadSampleCSV} className="btn-outline" style={{ fontSize: '0.85rem' }}>
              <Download size={14} /> Download Sample CSV
            </button>
          </div>
        </div>
      </div>

      {/* MODE TAB SWITCHER: CSV Batch Upload vs Single Machine Input */}
      <div style={{ display: 'flex', gap: '12px', background: '#f1f5f9', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
        <button
          onClick={() => setActiveUploadTab('csv')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            background: activeUploadTab === 'csv' ? '#ffffff' : 'transparent',
            color: activeUploadTab === 'csv' ? '#0284c7' : '#64748b',
            boxShadow: activeUploadTab === 'csv' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Upload size={18} /> Batch CSV File Upload
        </button>

        <button
          onClick={() => setActiveUploadTab('single')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            background: activeUploadTab === 'single' ? '#ffffff' : 'transparent',
            color: activeUploadTab === 'single' ? '#0284c7' : '#64748b',
            boxShadow: activeUploadTab === 'single' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <PlusCircle size={18} /> Single Machine Data Entry
        </button>
      </div>

      {/* TAB A: BATCH CSV FILE UPLOAD */}
      {activeUploadTab === 'csv' && (
        <div 
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: '2px dashed var(--color-primary)',
            borderRadius: '16px',
            padding: '30px 20px',
            textAlign: 'center',
            background: '#ffffff',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <input 
            type="file" 
            accept=".csv" 
            id="csv-upload-input" 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <label htmlFor="csv-upload-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.1)', padding: '12px', borderRadius: '50%', color: '#0284c7' }}>
              <Upload size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)' }}>
                {file ? `Selected File: ${file.name}` : 'Click to Upload or Drag & Drop Sensor CSV File'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Supports CSV files containing temperature, vibration, pressure, acoustic, and RPM sensor telemetry
              </p>
            </div>
            <span className="btn-primary" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              Browse CSV File
            </span>
          </label>
        </div>
      )}

      {/* TAB B: SINGLE MACHINE DATA ENTRY FORM */}
      {activeUploadTab === 'single' && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} color="var(--color-primary)" /> Single Machine Telemetry Submission Form
          </h3>

          <form onSubmit={handleSingleMachineSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Machine ID</label>
              <input 
                type="text" 
                value={singleMachine.id}
                onChange={e => setSingleMachine({ ...singleMachine, id: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Machine Name</label>
              <input 
                type="text" 
                value={singleMachine.name}
                onChange={e => setSingleMachine({ ...singleMachine, name: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Equipment Type</label>
              <select 
                value={singleMachine.type}
                onChange={e => setSingleMachine({ ...singleMachine, type: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px', background: '#fff' }}
              >
                <option value="Cooling Pump">Cooling Pump</option>
                <option value="CNC Lathe">CNC Lathe</option>
                <option value="Hydraulic Press">Hydraulic Press</option>
                <option value="Turbine Generator">Turbine Generator</option>
                <option value="Conveyor Drive">Conveyor Drive Motor</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Location / Sector</label>
              <input 
                type="text" 
                value={singleMachine.location}
                onChange={e => setSingleMachine({ ...singleMachine, location: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Temperature (°C)</label>
              <input 
                type="number" 
                step="0.1"
                value={singleMachine.temperature}
                onChange={e => setSingleMachine({ ...singleMachine, temperature: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Vibration (mm/s RMS)</label>
              <input 
                type="number" 
                step="0.1"
                value={singleMachine.vibration}
                onChange={e => setSingleMachine({ ...singleMachine, vibration: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Vibration Freq (Hz)</label>
              <input 
                type="number" 
                step="1"
                value={singleMachine.vibration_freq}
                onChange={e => setSingleMachine({ ...singleMachine, vibration_freq: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Pressure (PSI)</label>
              <input 
                type="number" 
                step="1"
                value={singleMachine.pressure}
                onChange={e => setSingleMachine({ ...singleMachine, pressure: e.target.value })}
                required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Acoustic (dB)</label>
              <input 
                type="number" 
                step="1"
                value={singleMachine.acoustic}
                onChange={e => setSingleMachine({ ...singleMachine, acoustic: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>RPM Speed</label>
              <input 
                type="number" 
                step="10"
                value={singleMachine.rpm}
                onChange={e => setSingleMachine({ ...singleMachine, rpm: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Load (%)</label>
              <input 
                type="number" 
                step="1"
                value={singleMachine.load_percent}
                onChange={e => setSingleMachine({ ...singleMachine, load_percent: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Operating Hours</label>
              <input 
                type="number" 
                step="50"
                value={singleMachine.operating_hours}
                onChange={e => setSingleMachine({ ...singleMachine, operating_hours: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginTop: '4px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '8px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn-primary" style={{ fontSize: '0.9rem', padding: '10px 24px' }}>
                <Save size={16} /> Evaluate & Save Single Machine Data
              </button>
            </div>
          </form>

          {/* Single Submission Diagnostic Result Banner */}
          {singleResult && (
            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: `${singleResult.prediction.risk_color}12`, border: `1px solid ${singleResult.prediction.risk_color}44` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: singleResult.prediction.risk_color, textTransform: 'uppercase' }}>
                    Instant ML Diagnostic Output
                  </span>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '2px' }}>
                    {singleResult.name} ({singleResult.id}) — <span style={{ color: singleResult.prediction.risk_color }}>{singleResult.prediction.predicted_failure_mode}</span>
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {singleResult.prediction.recommended_action}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: '700', color: singleResult.prediction.risk_color }}>
                    {(singleResult.prediction.failure_risk_score * 100).toFixed(1)}% Risk
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0284c7' }}>
                    Est. RUL: {singleResult.prediction.predicted_rul_hours} hrs
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SAVED DATASETS SELECTOR BAR */}
      {savedDatasets.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HardDrive size={20} color="#0284c7" />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Select Stored Dataset to Inspect:
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                ({savedDatasets.length} dataset{savedDatasets.length > 1 ? 's' : ''} stored)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select 
              value={batchResults?.id || ''} 
              onChange={(e) => {
                const selected = savedDatasets.find(d => d.id === e.target.value);
                if (selected) handleLoadSavedDataset(selected);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid var(--color-primary)',
                background: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--text-main)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {savedDatasets.map(ds => (
                <option key={ds.id} value={ds.id}>
                  📄 {ds.fileName} ({ds.totalRecords} records • {ds.uploadedAt})
                </option>
              ))}
            </select>

            {batchResults && (
              <button 
                onClick={() => exportEvaluatedDataset(batchResults)} 
                className="btn-outline" 
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                title="Export current dataset as JSON"
              >
                <Download size={14} /> Export JSON
              </button>
            )}
          </div>
        </div>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-main)' }}>
          <RefreshCw size={24} className="pulse-active" color="var(--color-primary)" style={{ marginBottom: '8px' }} />
          <p style={{ fontWeight: '600' }}>Evaluating ML predictions and saving dataset to storage...</p>
        </div>
      )}

      {/* Save Status Notification */}
      {retrainStatus && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '0.88rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: retrainStatus.success ? 'rgba(16,185,129,0.15)' : (retrainStatus.error ? 'rgba(239,68,68,0.15)' : 'rgba(2,132,199,0.12)'),
          color: retrainStatus.success ? '#047857' : (retrainStatus.error ? '#b91c1c' : '#0284c7'),
          border: `1px solid ${retrainStatus.success ? 'rgba(16,185,129,0.3)' : (retrainStatus.error ? 'rgba(239,68,68,0.3)' : '#93c5fd')}`
        }}>
          {retrainStatus.success ? <CheckCircle2 size={18} /> : (retrainStatus.error ? <AlertOctagon size={18} /> : <HardDrive size={18} />)}
          <span>{retrainStatus.message}</span>
        </div>
      )}

      {/* Fleet Import Status Toast */}
      {importStatus && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          fontSize: '0.88rem',
          fontWeight: '600',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          background: 'rgba(16,185,129,0.15)',
          color: '#047857',
          border: '1px solid rgba(16,185,129,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderCheck size={18} />
            <span>{importStatus.message}</span>
          </div>
          {onNavigateToFleet && (
            <button 
              onClick={onNavigateToFleet}
              className="btn-primary" 
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              Go to Fleet Overview <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* ACTIVE DISPLAYED DATASET SUMMARY & METRICS */}
      {batchResults && !isProcessing && (
        <>
          {/* Currently Viewing Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(2,132,199,0.08)', border: '1px solid rgba(2,132,199,0.2)', padding: '12px 20px', borderRadius: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="#0284c7" />
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                Displaying Saved Dataset: <span style={{ color: '#0284c7' }}>{batchResults.fileName}</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ({batchResults.totalRecords} records • Uploaded {batchResults.uploadedAt})
              </span>
            </div>
            <button 
              onClick={() => handleImportCurrentToFleet(batchResults)}
              className="btn-primary" 
              style={{ fontSize: '0.8rem', padding: '5px 12px', background: '#059669', borderColor: '#059669' }}
            >
              <FolderCheck size={14} /> Import to Active Fleet
            </button>
          </div>

          {/* Summary Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Records Evaluated</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px' }}>
                {batchResults.totalRecords}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saved in {batchResults.fileName}</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Healthy Units</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
                {batchResults.healthyCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '600' }}>
                {((batchResults.healthyCount / batchResults.totalRecords) * 100).toFixed(1)}% Fleet Normal
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Warnings & Attention</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#d97706', marginTop: '4px' }}>
                {batchResults.warningCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: '600' }}>Early Degradation</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Critical Anomaly Risk</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#dc2626', marginTop: '4px' }}>
                {batchResults.criticalCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: '600' }}>Action Required</div>
            </div>

            <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Avg RUL (Hours)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#0284c7', marginTop: '4px' }}>
                {batchResults.avgRul} hrs
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mean Remaining RUL</div>
            </div>
          </div>

          {/* Stored Rows Evaluation Table */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-primary)" /> Stored Machine Telemetry Records ({batchResults.fileName})
              </h3>

              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px' }}>
                <Search size={16} color="var(--text-dim)" />
                <input 
                  type="text" 
                  placeholder="Search machine ID or mode..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', color: 'var(--text-main)', width: '200px' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textTransform: 'uppercase', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Asset ID / Name</th>
                    <th style={{ padding: '10px' }}>Temp (°C)</th>
                    <th style={{ padding: '10px' }}>Vib (mm/s)</th>
                    <th style={{ padding: '10px' }}>Pressure (PSI)</th>
                    <th style={{ padding: '10px' }}>Diagnosed Failure Mode</th>
                    <th style={{ padding: '10px' }}>Risk Index</th>
                    <th style={{ padding: '10px' }}>Est RUL</th>
                    <th style={{ padding: '10px' }}>Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row, idx) => {
                    const p = row.prediction;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px', fontWeight: '600', color: 'var(--text-main)' }}>
                          <div>{row.id}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400' }}>{row.name}</div>
                        </td>
                        <td style={{ padding: '10px', color: row.telemetry.temperature > 75 ? '#dc2626' : 'var(--text-main)' }}>
                          {row.telemetry.temperature}°C
                        </td>
                        <td style={{ padding: '10px', color: row.telemetry.vibration > 4.5 ? '#dc2626' : 'var(--text-main)' }}>
                          {row.telemetry.vibration} mm/s
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text-main)' }}>
                          {row.telemetry.pressure} PSI
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span className="badge" style={{ background: `${p.risk_color}18`, color: p.risk_color, border: `1px solid ${p.risk_color}44` }}>
                            {p.predicted_failure_mode}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: '700', color: p.risk_color, fontSize: '0.8rem' }}>
                            {(p.failure_risk_score * 100).toFixed(1)}%
                          </div>
                          <div style={{ height: '4px', width: '80px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                            <div style={{ height: '100%', width: `${p.failure_risk_score * 100}%`, background: p.risk_color }} />
                          </div>
                        </td>
                        <td style={{ padding: '10px', fontWeight: '600', color: p.predicted_rul_hours < 100 ? '#dc2626' : '#059669' }}>
                          {p.predicted_rul_hours}h
                        </td>
                        <td style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px' }}>
                          {p.recommended_action}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredRows.length)} of {filteredRows.length} entries
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="btn-outline" 
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '4px 10px', fontWeight: '600', color: 'var(--text-main)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="btn-outline" 
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* SAVED DATASETS REPOSITORY GRID */}
      {savedDatasets.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive size={20} color="var(--color-primary)" /> Saved Datasets History ({savedDatasets.length})
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Stored files repository. Select any dataset below to view its status cards & records table.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {savedDatasets.map(ds => {
              const isCurrentlyActive = batchResults && batchResults.id === ds.id;
              return (
                <div 
                  key={ds.id} 
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: isCurrentlyActive ? 'rgba(2, 132, 199, 0.08)' : '#ffffff',
                    border: `1px solid ${isCurrentlyActive ? 'var(--color-primary)' : '#cbd5e1'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        📄 {ds.fileName}
                      </div>
                      {isCurrentlyActive ? (
                        <span className="badge badge-healthy" style={{ fontSize: '0.7rem' }}>Active</span>
                      ) : (
                        <span className="badge" style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b' }}>Stored</span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Uploaded: {ds.uploadedAt}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '10px', fontSize: '0.8rem', fontWeight: '600' }}>
                      <span style={{ color: 'var(--text-main)' }}>📊 {ds.totalRecords} Records</span>
                      <span style={{ color: '#059669' }}>✓ {ds.healthyCount} Healthy</span>
                      {ds.criticalCount > 0 && <span style={{ color: '#dc2626' }}>⚠️ {ds.criticalCount} Critical</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleLoadSavedDataset(ds)}
                      className={isCurrentlyActive ? 'btn-primary' : 'btn-outline'}
                      style={{ fontSize: '0.75rem', padding: '5px 10px', flex: 1, justifyContent: 'center' }}
                    >
                      <Eye size={12} /> {isCurrentlyActive ? 'Viewing On Screen' : 'Load Data'}
                    </button>

                    <button 
                      onClick={() => handleImportCurrentToFleet(ds)}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '5px 10px', flex: 1, justifyContent: 'center', borderColor: '#059669', color: '#059669' }}
                      title="Import into Active Fleet"
                    >
                      <FolderCheck size={12} /> Fleet Import
                    </button>

                    <button 
                      onClick={() => exportEvaluatedDataset(ds)}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '5px 8px' }}
                      title="Export JSON"
                    >
                      <Download size={12} />
                    </button>

                    <button 
                      onClick={() => handleDeleteSavedDataset(ds.id)}
                      className="btn-outline"
                      style={{ fontSize: '0.75rem', padding: '5px 8px', borderColor: '#ef4444', color: '#ef4444' }}
                      title="Delete Saved Dataset"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
