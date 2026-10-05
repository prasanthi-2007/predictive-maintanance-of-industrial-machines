# ApexPredict AI — Predictive Maintenance Operations Platform

Industrial Machine Failure Risk Evaluation & Remaining Useful Life (RUL) Prediction System.

---

## How to Run in VS Code (Step-by-Step)

### Step 1: Open Folder in VS Code
1. Open **VS Code**.
2. Click **File** -> **Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Select the project folder:
   `c:\Users\prasanthi\OneDrive\文档\IBMQ2DST2217_Prototype`

---

### Step 2: Start Python Backend Server (Terminal 1)
1. In VS Code, open a terminal: **Terminal** -> **New Terminal** (or `Ctrl + ~`).
2. Run:
   ```bash
   python server.py
   ```
3. You will see:
   ```
   Starting Predictive Maintenance Flask Server on port 5000...
   * Running on http://127.0.0.1:5000
   ```

---

### Step 3: Start React Frontend Application (Terminal 2)
1. In VS Code terminal panel, click the **`+`** icon (New Terminal) to open a second terminal.
2. Navigate into the frontend directory and start Vite:
   ```bash
   cd predictive-maintenance-app
   npm install
   npm run dev
   ```
3. You will see:
   ```
   VITE v8.2.1 ready in 347 ms
   ➜ Local: http://localhost:5173/
   ```

---

### Step 4: Open in Browser
Open your browser and navigate to:
👉 **http://localhost:5173/**

---

## Features
- **Fleet Matrix**: Monitored machine overview, health badges, RUL hours, and risk indicators.
- **Sensor Telemetry**: Live chart streaming for temperature, vibration, pressure, and acoustic sensors with spike injection.
- **Fault Sandbox**: Interactive scenario generator for bearing wear, overheating, rotor imbalance, and pressure drops.
- **Saved Datasets & Upload**:
  - **Batch CSV Upload**: Drag & drop custom CSV telemetry files.
  - **Single Machine Data Entry**: Interactive form to input individual machine telemetry.
  - **Auto-Save & Persistence**: All datasets auto-save to browser storage & sync with Python server.
- **Work Orders & ROI**: Maintenance task automation and cost savings tracker.
- **Model Analytics**: Random Forest ROC curves, feature importance charts, and confusion matrix metrics.
