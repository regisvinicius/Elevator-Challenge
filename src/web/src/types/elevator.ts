export const ELEVATOR_STATE = [
  "Idle",
  "MovingUp",
  "MovingDown",
  "DoorOpening",
  "DoorOpen",
  "DoorClosing",
  "Maintenance",
  "EmergencyStopped",
] as const;
export type ElevatorState = (typeof ELEVATOR_STATE)[number];

export const DIRECTION = ["Up", "Down"] as const;
export type Direction = (typeof DIRECTION)[number];

export const ELEVATOR_TYPE = ["Local", "Express", "Freight"] as const;
export type ElevatorType = (typeof ELEVATOR_TYPE)[number];

export interface SingleStatus {
  floor: number;
  state: string;
}

export interface ElevatorStatus {
  id: number;
  currentFloor: number;
  state: ElevatorState;
  pendingRequestCount: number;
  targetFloors: number[];
}

export interface EnterpriseElevatorStatus {
  id: number;
  type: ElevatorType;
  currentFloor: number;
  state: ElevatorState;
  pendingRequestCount: number;
  targetFloors: number[];
  allowedFloors: number[];
}

export interface ElevatorAnalyticsEntry {
  tripsCompleted: number;
  averageWaitTimeMs: number;
}

export interface ElevatorAnalytics {
  totalTripsCompleted: number;
  averageWaitTimeMs: number;
  byElevator: Record<string, ElevatorAnalyticsEntry>;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
}
