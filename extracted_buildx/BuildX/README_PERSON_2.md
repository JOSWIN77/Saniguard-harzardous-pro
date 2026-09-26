# SaniGuard — Person 2 Module: Worker Movement & Emergency (IMU + SOS)

## 1. Module Overview
This module simulates:
1. **MPU6050 6-Axis Motion Sensor**: Acceleration, impact detection, and orientation telemetry across 5 motion presets:
   - `NORMAL` (1.0g, no impact, normal orientation)
   - `WALKING` (1.4g, no impact, normal orientation)
   - `IMPACT` (2.8g, shock impact detected, normal orientation)
   - `FALL` (3.8g, severe deceleration spike, abnormal orientation)
   - `NO_MOVEMENT` (0.2g, lack of motion / potential man-down)
2. **Industrial Emergency SOS Push Button**:
   - `TRIGGER SOS` emits `sos: true`
   - `Cancel SOS` returns `sos: false`
3. **Reset Simulation**: Returns motion to `NORMAL` (1.0g) and SOS to `false`.

> [!NOTE]
> **SIMULATED SENSOR DATA**: This module outputs simulated telemetry. It does **not** decide `SAFE`, `WARNING`, or `CRITICAL`. That responsibility belongs exclusively to **Person 4's Risk Engine**.

---

## 2. Shared Data Contract

### Module Output: `onDataChange(data)`
```json
{
  "motion": {
    "state": "FALL",
    "impact": true,
    "acceleration": 3.8,
    "orientation": "ABNORMAL"
  },
  "emergency": {
    "sos": false
  }
}
```

### Destination in Shared SaniGuard Object
```json
{
  "worker_id": "SW-001",
  "environment": {},
  "motion": {
    "state": "FALL",
    "impact": true,
    "acceleration": 3.8,
    "orientation": "ABNORMAL"
  },
  "emergency": {
    "sos": false
  },
  "location": {},
  "battery": {},
  "system": {}
}
```

---

## 3. Component Usage (For Person 4 / Host Application)

```tsx
import React from 'react';
import WorkerMovementEmergency from './components/WorkerMovementEmergency';
// or: import WorkerMovementEmergency from './WorkerMovementEmergency';

export const MainApp = () => {
  const handlePerson2Update = (data) => {
    console.log("Person 2 Telemetry received:", data);
    // Pass into Person 4 Risk Engine:
    // if (data.emergency.sos || (data.motion.state === "FALL" && data.motion.orientation === "ABNORMAL")) {
    //   triggerCriticalAlert();
    // }
  };

  return (
    <div className="p-4">
      <WorkerMovementEmergency 
        workerId="SW-001"
        onDataChange={handlePerson2Update} 
      />
    </div>
  );
};
```

---

## 4. Test Verification Scenarios

| Test Case | User Action | Expected Output |
| :--- | :--- | :--- |
| **Normal** | Click `NORMAL` | `1.0g`, `impact: false`, `orientation: "NORMAL"` |
| **Walking** | Click `WALKING` | `1.4g`, `impact: false`, `orientation: "NORMAL"` |
| **Impact** | Click `IMPACT` | `2.8g`, `impact: true`, `orientation: "NORMAL"` |
| **Fall** | Click `FALL` | `3.8g`, `impact: true`, `orientation: "ABNORMAL"` |
| **No Movement** | Click `NO_MOVEMENT` | `0.2g`, `impact: false`, `orientation: "NORMAL"` |
| **Emergency SOS** | Click `TRIGGER SOS` | `sos: true`, SOS active strobe, alert flag |
| **Cancel SOS** | Click `Cancel SOS` | `sos: false`, returns to standby |
| **Reset** | Click `Reset Simulation`| `NORMAL` state, `1.0g`, `sos: false` |
