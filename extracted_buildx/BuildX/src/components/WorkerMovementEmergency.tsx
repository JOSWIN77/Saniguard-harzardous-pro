import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Person2Data, MotionState, OrientationState } from '../types/saniguard';
import './WorkerMovementEmergency.css';

export interface WorkerMovementEmergencyProps {
  /** Callback fired whenever motion or emergency data updates */
  onDataChange?: (data: Person2Data) => void;
  /** Initial motion state (defaults to "NORMAL") */
  initialMotionState?: MotionState;
  /** Initial SOS state (defaults to false) */
  initialSos?: boolean;
  /** Associated Worker ID (defaults to "SW-001") */
  workerId?: string;
  /** Optional custom CSS class name */
  className?: string;
}

/** Preset parameters for MPU6050 motion simulation */
interface PresetConfig {
  state: MotionState;
  impact: boolean;
  acceleration: number;
  orientation: OrientationState;
  description: string;
  badgeColor: string;
  simulatedAxes: {
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    pitch: number;
    roll: number;
  };
}

const MOTION_PRESETS: Record<MotionState, PresetConfig> = {
  NORMAL: {
    state: "NORMAL",
    impact: false,
    acceleration: 1.0,
    orientation: "NORMAL",
    description: "Standard upright posture, stationary baseline gravity (1.0g)",
    badgeColor: "#10b981", // emerald
    simulatedAxes: { ax: 0.02, ay: 0.05, az: 0.99, gx: 0.3, gy: 0.1, gz: 0.2, pitch: 1, roll: 2 }
  },
  WALKING: {
    state: "WALKING",
    impact: false,
    acceleration: 1.4,
    orientation: "NORMAL",
    description: "Rhythmic worker locomotion, moderate acceleration spikes (1.4g)",
    badgeColor: "#3b82f6", // blue
    simulatedAxes: { ax: 0.35, ay: 0.42, az: 1.28, gx: 12.4, gy: 18.2, gz: 8.5, pitch: 4, roll: 7 }
  },
  IMPACT: {
    state: "IMPACT",
    impact: true,
    acceleration: 2.8,
    orientation: "NORMAL",
    description: "Sudden mechanical bump or blunt helmet impact detected (2.8g)",
    badgeColor: "#f59e0b", // amber
    simulatedAxes: { ax: 1.95, ay: 1.45, az: 1.52, gx: 75.3, gy: 82.1, gz: 40.0, pitch: 12, roll: 18 }
  },
  FALL: {
    state: "FALL",
    impact: true,
    acceleration: 3.8,
    orientation: "ABNORMAL",
    description: "Freefall & severe deceleration spike (3.8g) with abnormal posture / tilt",
    badgeColor: "#ef4444", // red
    simulatedAxes: { ax: 2.85, ay: 2.15, az: 0.35, gx: 180.5, gy: 210.0, gz: 95.4, pitch: 78, roll: 64 }
  },
  NO_MOVEMENT: {
    state: "NO_MOVEMENT",
    impact: false,
    acceleration: 0.2,
    orientation: "NORMAL",
    description: "Prolonged inactivity / lack of micro-tremors (0.2g, potential man-down)",
    badgeColor: "#a855f7", // purple
    simulatedAxes: { ax: 0.01, ay: 0.01, az: 0.20, gx: 0.0, gy: 0.1, gz: 0.0, pitch: 2, roll: 1 }
  }
};

interface TelemetryLogEntry {
  id: string;
  time: string;
  type: "MOTION" | "SOS" | "SYSTEM";
  message: string;
  highlight?: boolean;
}

export const WorkerMovementEmergency: React.FC<WorkerMovementEmergencyProps> = ({
  onDataChange,
  initialMotionState = "NORMAL",
  initialSos = false,
  workerId = "SW-001",
  className = ""
}) => {
  // State
  const [motionState, setMotionState] = useState<MotionState>(initialMotionState);
  const [impact, setImpact] = useState<boolean>(MOTION_PRESETS[initialMotionState].impact);
  const [acceleration, setAcceleration] = useState<number>(MOTION_PRESETS[initialMotionState].acceleration);
  const [orientation, setOrientation] = useState<OrientationState>(MOTION_PRESETS[initialMotionState].orientation);
  const [sos, setSos] = useState<boolean>(initialSos);
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([
    {
      id: "init-1",
      time: new Date().toLocaleTimeString(),
      type: "SYSTEM",
      message: `MPU6050 & SOS Simulator initialized for Worker ${workerId}`
    }
  ]);
  const [copied, setCopied] = useState<boolean>(false);

  // Current compiled Person 2 output
  const currentPayload: Person2Data = useMemo(() => ({
    motion: {
      state: motionState,
      impact,
      acceleration: Number(acceleration.toFixed(2)),
      orientation
    },
    emergency: {
      sos
    }
  }), [motionState, impact, acceleration, orientation, sos]);

  // Notify parent component / Person 4 risk engine whenever output changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange(currentPayload);
    }
  }, [currentPayload, onDataChange]);

  const addLog = useCallback((type: "MOTION" | "SOS" | "SYSTEM", message: string, highlight = false) => {
    const entry: TelemetryLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      highlight
    };
    setLogs(prev => [entry, ...prev.slice(0, 19)]);
  }, []);

  // Handle Motion Preset Switch
  const selectMotionPreset = (presetKey: MotionState) => {
    const preset = MOTION_PRESETS[presetKey];
    setMotionState(preset.state);
    setImpact(preset.impact);
    setAcceleration(preset.acceleration);
    setOrientation(preset.orientation);

    addLog(
      "MOTION",
      `Preset switched to ${preset.state}: ${preset.acceleration}g | Impact: ${preset.impact} | Orientation: ${preset.orientation}`,
      preset.state === "FALL" || preset.state === "IMPACT"
    );
  };

  // Trigger SOS
  const handleTriggerSos = () => {
    setSos(true);
    addLog("SOS", "🚨 EMERGENCY SOS BUTTON PRESSED! Alert flag sos: true emitted", true);
  };

  // Cancel SOS
  const handleCancelSos = () => {
    setSos(false);
    addLog("SOS", "SOS emergency signal manually CANCELLED. sos: false emitted", false);
  };

  // Reset Simulation to default baseline
  const handleResetSimulation = () => {
    const defaultPreset = MOTION_PRESETS.NORMAL;
    setMotionState("NORMAL");
    setImpact(defaultPreset.impact);
    setAcceleration(defaultPreset.acceleration);
    setOrientation(defaultPreset.orientation);
    setSos(false);
    addLog("SYSTEM", "Simulation reset to baseline (NORMAL motion, 1.0g, SOS cleared)");
  };

  const copyPayloadJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentConfig = MOTION_PRESETS[motionState];
  const { simulatedAxes } = currentConfig;

  return (
    <div className={`sg-module-container ${className}`}>
      {/* Header bar */}
      <div className="sg-header-bar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span className="sg-badge-person2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>
                <path d="M4 21v-3a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v3"/>
              </svg>
              Person 2 Module
            </span>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Worker: <strong style={{ color: '#cbd5e1' }}>{workerId}</strong>
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Worker Movement &amp; Emergency (IMU + SOS)
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            MPU6050 6-Axis Motion &amp; Fall Detection Simulator with Industrial Emergency SOS
          </p>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            type="button" 
            className="sg-btn-reset-sim"
            onClick={handleResetSimulation}
            title="Reset to default baseline (NORMAL, 1.0g, SOS off)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset Simulation
          </button>
        </div>
      </div>

      {/* Mandatory Safety Notice / Simulation Disclaimer */}
      <div className="sg-banner-simulated">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>
          <strong>SIMULATED SENSOR DATA</strong>: Software simulation of MPU6050 and SOS switch. Real deployment requires calibrated industrial-grade sensors.
        </span>
      </div>

      {/* Main Grid: Motion Simulator (Left) + Emergency SOS (Right) */}
      <div className="sg-grid-2col">
        {/* LEFT COLUMN: MPU6050 Motion Simulator */}
        <div className="sg-card">
          <div className="sg-card-title">
            <span>MPU6050 Motion Presets</span>
            <span style={{ fontSize: '0.72rem', color: '#06b6d4', textTransform: 'none' }}>
              I2C Bus: 0x68
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="sg-preset-btn-group">
            {(Object.keys(MOTION_PRESETS) as MotionState[]).map((key) => {
              const item = MOTION_PRESETS[key];
              const isSelected = motionState === key;
              const isDanger = key === "FALL" || key === "IMPACT";

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectMotionPreset(key)}
                  className={`sg-btn-preset ${isSelected ? 'active' : ''} ${isSelected && isDanger ? 'danger-preset' : ''}`}
                >
                  <span style={{ fontWeight: 700 }}>{key}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    {item.acceleration}g {item.impact ? '• Impact' : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Live Telemetry Display */}
          <div style={{ background: '#020617', padding: '12px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <div className="sg-telemetry-row">
              <span style={{ color: '#94a3b8' }}>State</span>
              <span 
                className="sg-telemetry-badge"
                style={{ 
                  backgroundColor: `${currentConfig.badgeColor}22`,
                  color: currentConfig.badgeColor,
                  border: `1px solid ${currentConfig.badgeColor}66`
                }}
              >
                ● {motionState}
              </span>
            </div>

            <div className="sg-telemetry-row">
              <span style={{ color: '#94a3b8' }}>Acceleration Magnitude</span>
              <span style={{ fontWeight: 700, color: acceleration >= 3.0 ? '#ef4444' : '#f8fafc' }}>
                {acceleration.toFixed(2)} g
              </span>
            </div>

            {/* Acceleration Gauge Bar */}
            <div className="sg-acc-bar-wrap">
              <div 
                className="sg-acc-bar-fill" 
                style={{ 
                  width: `${Math.min(100, (acceleration / 4.5) * 100)}%`,
                  backgroundColor: acceleration >= 3.0 ? '#ef4444' : acceleration >= 2.0 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>

            <div className="sg-telemetry-row" style={{ marginTop: '6px' }}>
              <span style={{ color: '#94a3b8' }}>Impact Detected</span>
              <span style={{ fontWeight: 700, color: impact ? '#ef4444' : '#10b981' }}>
                {impact ? 'TRUE (Shock detected)' : 'FALSE'}
              </span>
            </div>

            <div className="sg-telemetry-row">
              <span style={{ color: '#94a3b8' }}>Orientation Posture</span>
              <span style={{ fontWeight: 700, color: orientation === "ABNORMAL" ? '#ef4444' : '#10b981' }}>
                {orientation}
              </span>
            </div>
          </div>

          {/* 3D Helmet Posture Visualizer */}
          <div className="sg-imu-canvas">
            <div className="sg-helmet-model-box">
              <div 
                className={`sg-helmet-disc ${orientation === "ABNORMAL" ? 'abnormal' : ''}`}
                style={{
                  transform: `rotateX(${simulatedAxes.pitch}deg) rotateZ(${simulatedAxes.roll}deg)`
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>🪖</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8' }}>HELMET</span>
              </div>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <div>Pitch: <strong style={{ color: '#f8fafc' }}>{simulatedAxes.pitch}°</strong> | Roll: <strong style={{ color: '#f8fafc' }}>{simulatedAxes.roll}°</strong></div>
              <div>Ax: {simulatedAxes.ax}g | Ay: {simulatedAxes.ay}g | Az: {simulatedAxes.az}g</div>
              <div>Gx: {simulatedAxes.gx}°/s | Gy: {simulatedAxes.gy}°/s</div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Emergency SOS Button & Controls */}
        <div className="sg-card">
          <div className="sg-card-title">
            <span>Emergency SOS Trigger</span>
            <span style={{ 
              fontSize: '0.72rem', 
              color: sos ? '#ef4444' : '#10b981',
              fontWeight: 700
            }}>
              {sos ? '● SOS BROADCASTING' : '○ STANDBY'}
            </span>
          </div>

          <div className={`sg-sos-container ${sos ? 'active-sos' : ''}`}>
            <button
              type="button"
              className={`sg-sos-btn ${sos ? 'sos-triggered' : ''}`}
              onClick={handleTriggerSos}
              title="Click to trigger emergency SOS distress signal"
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>{sos ? 'SOS ON' : 'TRIGGER SOS'}</span>
            </button>

            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '14px', marginBottom: '4px' }}>
              {sos ? 'Distress signal active! Dispatches sos: true to Risk Engine.' : 'Industrial push-button simulation for immediate worker distress.'}
            </p>

            {sos ? (
              <button
                type="button"
                className="sg-btn-cancel-sos"
                style={{ background: '#ef4444', color: '#ffffff', borderColor: '#f87171' }}
                onClick={handleCancelSos}
              >
                ✓ Cancel SOS Signal
              </button>
            ) : (
              <button
                type="button"
                className="sg-btn-cancel-sos"
                onClick={handleCancelSos}
                disabled
                style={{ opacity: 0.4, cursor: 'not-allowed' }}
              >
                Cancel SOS (Idle)
              </button>
            )}
          </div>

          {/* Quick Scenario Shortcuts */}
          <div style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Quick Scenario Tests
            </span>
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { selectMotionPreset("FALL"); }}
                className="sg-btn-reset-sim"
                style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }}
              >
                ⚡ Trigger Fall (3.8g)
              </button>
              <button
                type="button"
                onClick={() => { handleTriggerSos(); }}
                className="sg-btn-reset-sim"
                style={{ color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.4)' }}
              >
                🚨 Trigger SOS Alarm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Output Contract JSON & Telemetry Audit Log */}
      <div className="sg-card" style={{ marginBottom: 0 }}>
        <div className="sg-card-title">
          <span>Live Person 2 Output (Emitted via onDataChange)</span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'none' }}>
            Bound to Person 4 / Common SaniGuard Contract
          </span>
        </div>

        <div className="sg-json-box">
          <button 
            type="button" 
            className="sg-copy-btn"
            onClick={copyPayloadJson}
          >
            {copied ? '✓ Copied!' : 'Copy JSON'}
          </button>
          <pre style={{ margin: 0 }}>
            {JSON.stringify(currentPayload, null, 2)}
          </pre>
        </div>

        {/* Telemetry Activity Log */}
        <div style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
              Sensor Event Stream
            </span>
            <span style={{ fontSize: '0.7rem', color: '#475569' }}>
              {logs.length} events recorded
            </span>
          </div>
          <div className="sg-log-list">
            {logs.map((log) => (
              <div key={log.id} className={`sg-log-item ${log.highlight ? 'highlight' : ''}`}>
                <span style={{ color: '#475569' }}>[{log.time}]</span>
                <span style={{ 
                  color: log.type === "SOS" ? '#ef4444' : log.type === "MOTION" ? '#06b6d4' : '#94a3b8',
                  fontWeight: 700
                }}>
                  [{log.type}]
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerMovementEmergency;
