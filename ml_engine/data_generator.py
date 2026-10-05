import numpy as np
import pandas as pd
import json
import os

def generate_sensor_telemetry(num_samples=15000, random_seed=42):
    np.random.seed(random_seed)
    
    machine_types = ['CNC Lathe', 'Hydraulic Press', 'Turbine Generator', 'Conveyor Drive']
    machine_ids = [f"MACH-{i:03d}" for i in range(1, 21)]
    
    records = []
    
    for i in range(num_samples):
        machine_id = np.random.choice(machine_ids)
        m_idx = int(machine_id.split('-')[1])
        m_type = machine_types[m_idx % len(machine_types)]
        
        # Operational baseline variables
        operating_hours = np.random.uniform(100, 10000)
        load_percent = np.random.uniform(40, 110)
        ambient_temp = np.random.uniform(18, 32)
        
        # Latent degradation factor (0 = pristine, 1 = total failure imminent)
        # Mix of normal wear and accelerated degradation
        if np.random.rand() < 0.78:
            degradation = np.random.beta(a=1.2, b=6.0) # Mostly normal
        else:
            degradation = np.random.beta(a=4.0, b=1.5) # Fault condition
            
        # Determine failure mode based on degradation threshold
        if degradation < 0.45:
            failure_mode = 'Normal'
        else:
            mode_dice = np.random.rand()
            if mode_dice < 0.35:
                failure_mode = 'Bearing Wear'
            elif mode_dice < 0.65:
                failure_mode = 'Overheating'
            elif mode_dice < 0.82:
                failure_mode = 'Hydraulic Pressure Drop'
            else:
                failure_mode = 'Rotor Imbalance'
        
        # Physical sensor readings with realistic correlations and noise
        # 1. Temperature (°C)
        base_temp = 45.0 + (load_percent - 50) * 0.25 + ambient_temp * 0.4
        temp_spike = 45.0 * degradation if failure_mode in ['Overheating', 'Bearing Wear'] else 8.0 * degradation
        temperature = base_temp + temp_spike + np.random.normal(0, 1.5)
        
        # 2. Vibration Velocity (mm/s RMS)
        base_vib = 1.2 + (load_percent / 100) * 0.8
        vib_spike = 14.0 * (degradation ** 1.3) if failure_mode in ['Bearing Wear', 'Rotor Imbalance'] else 3.0 * degradation
        vibration = base_vib + vib_spike + np.random.normal(0, 0.3)
        vibration = max(0.1, vibration)
        
        # 3. Vibration Frequency Peak (Hz)
        base_freq = 60.0 if m_type in ['CNC Lathe', 'Turbine Generator'] else 30.0
        freq_shift = np.random.uniform(150, 400) * degradation if failure_mode == 'Bearing Wear' else np.random.normal(0, 5)
        vibration_freq = base_freq + freq_shift
        
        # 4. Hydraulic / Oil Pressure (PSI)
        base_pressure = 1500.0 if m_type == 'Hydraulic Press' else 85.0
        pressure_drop = base_pressure * 0.50 * degradation if failure_mode == 'Hydraulic Pressure Drop' else 0.0
        pressure = base_pressure - pressure_drop + np.random.normal(0, base_pressure * 0.02)
        
        # 5. Acoustic Emission (dB)
        base_acoustic = 65.0 + (load_percent / 100) * 10.0
        acoustic_spike = 30.0 * degradation if failure_mode in ['Bearing Wear', 'Rotor Imbalance'] else 6.0 * degradation
        acoustic = base_acoustic + acoustic_spike + np.random.normal(0, 1.5)
        
        # 6. Motor / Spindle Speed (RPM)
        base_rpm = 3000.0 if m_type in ['CNC Lathe', 'Turbine Generator'] else 1450.0
        rpm_fluctuation = -200.0 * degradation if failure_mode != 'Normal' else np.random.normal(0, 10)
        rpm = base_rpm + rpm_fluctuation + np.random.normal(0, 15)
        
        # Target variables
        is_failure = 0 if failure_mode == 'Normal' else 1
        
        # Remaining Useful Life (RUL) in Hours
        if is_failure == 0:
            rul_hours = float(np.random.uniform(300, 2000))
        else:
            rul_hours = float(max(1.0, (1.0 - degradation) * 120.0 + np.random.uniform(0, 15)))
            
        # Risk Score (0.0 to 1.0)
        risk_score = float(np.clip(degradation * 1.05 + (0.1 if is_failure else 0.0), 0.02, 0.99))
        
        records.append({
            'timestamp_idx': i,
            'machine_id': machine_id,
            'machine_type': m_type,
            'operating_hours': round(operating_hours, 1),
            'load_percent': round(load_percent, 2),
            'temperature': round(temperature, 2),
            'vibration': round(vibration, 2),
            'vibration_freq': round(vibration_freq, 2),
            'pressure': round(pressure, 2),
            'acoustic': round(acoustic, 2),
            'rpm': round(rpm, 1),
            'degradation_factor': round(degradation, 4),
            'failure_mode': failure_mode,
            'is_failure': is_failure,
            'risk_score': round(risk_score, 4),
            'rul_hours': round(rul_hours, 1)
        })
        
    df = pd.DataFrame(records)
    return df

if __name__ == '__main__':
    os.makedirs('ml_engine/data', exist_ok=True)
    print("Generating synthetic sensor telemetry dataset...")
    df = generate_sensor_telemetry(num_samples=15000, random_seed=42)
    output_path = 'ml_engine/data/sensor_telemetry.csv'
    df.to_csv(output_path, index=False)
    print(f"Dataset successfully created at '{output_path}' with {len(df)} records.")
    print("Class distribution of failure modes:")
    print(df['failure_mode'].value_counts())
