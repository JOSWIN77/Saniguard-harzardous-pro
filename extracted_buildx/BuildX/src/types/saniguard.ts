/**
 * SaniGuard IoT Safety Helmet - Shared Data Schema
 * Standardized across all 4 team modules:
 * Person 1: Environmental Sensors (Gas + Temperature)
 * Person 2: Worker Movement & Emergency (IMU + SOS)
 * Person 3: Location & Device Health (GPS + Battery)
 * Person 4: Arduino Integration + Risk Engine + Alerts
 */

export type MotionState = "NORMAL" | "WALKING" | "IMPACT" | "FALL" | "NO_MOVEMENT";
export type OrientationState = "NORMAL" | "ABNORMAL";

/**
 * Person 2 Module Output: Motion & IMU Telemetry (Simulated MPU6050)
 */
export interface MotionPayload {
  state: MotionState;
  impact: boolean;
  acceleration: number; // in 'g' (e.g. 1.0, 1.4, 2.8, 3.8, 0.2)
  orientation: OrientationState;
}

/**
 * Person 2 Module Output: Emergency SOS Button
 */
export interface EmergencyPayload {
  sos: boolean;
}

/**
 * Combined Person 2 Output Data emitted via onDataChange(data)
 */
export interface Person2Data {
  motion: MotionPayload;
  emergency: EmergencyPayload;
}

/**
 * Complete Shared SaniGuard Data Contract (Used by Person 4 Central Edge Controller)
 */
export interface SaniGuardSharedData {
  worker_id: string;
  environment: {
    gas: number;
    gas_status: "NORMAL" | "WARNING" | "CRITICAL";
    temperature: number;
    temperature_status: "NORMAL" | "HIGH" | "EXTREME";
    humidity: number;
  };
  motion: MotionPayload;
  emergency: EmergencyPayload;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  battery: {
    percentage: number;
    status: "GOOD" | "LOW" | "CRITICAL";
    charging: boolean;
  };
  system: {
    overall_status: "SAFE" | "WARNING" | "CRITICAL";
    reason: string;
  };
}
