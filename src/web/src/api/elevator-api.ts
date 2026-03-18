import type {
  Direction,
  ElevatorAnalytics,
  ElevatorState,
  ElevatorStatus,
  ElevatorType,
  EnterpriseElevatorStatus,
  HealthStatus,
  SingleStatus,
} from "@/types/elevator";
import { z } from "zod";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

const elevatorStateSchema = z.union([
  z.enum([
    "Idle",
    "MovingUp",
    "MovingDown",
    "DoorOpening",
    "DoorOpen",
    "DoorClosing",
    "Maintenance",
    "EmergencyStopped",
  ]),
  z.number().transform((n) => {
    const states: ElevatorState[] = [
      "Idle",
      "MovingUp",
      "MovingDown",
      "DoorOpening",
      "DoorOpen",
      "DoorClosing",
      "Maintenance",
      "EmergencyStopped",
    ];
    return states[n] ?? "Idle";
  }),
]);

const elevatorTypeSchema = z.union([
  z.enum(["Local", "Express", "Freight"]),
  z.number().transform((n) => {
    const types: ElevatorType[] = ["Local", "Express", "Freight"];
    return types[n] ?? "Local";
  }),
]);

const singleStatusSchema = z.object({
  floor: z.number(),
  state: z.string(),
});

const elevatorStatusSchema = z.object({
  id: z.number(),
  currentFloor: z.number(),
  state: elevatorStateSchema,
  pendingRequestCount: z.number(),
  targetFloors: z.array(z.number()),
});

const enterpriseElevatorStatusSchema = z.object({
  id: z.number(),
  type: elevatorTypeSchema,
  currentFloor: z.number(),
  state: elevatorStateSchema,
  pendingRequestCount: z.number(),
  targetFloors: z.array(z.number()),
  allowedFloors: z.array(z.number()),
});

const elevatorAnalyticsEntrySchema = z.object({
  tripsCompleted: z.number(),
  averageWaitTimeMs: z.number(),
});

const elevatorAnalyticsSchema = z.object({
  totalTripsCompleted: z.number(),
  averageWaitTimeMs: z.number(),
  byElevator: z.record(z.string(), elevatorAnalyticsEntrySchema),
});

async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as unknown;
  return schema.parse(json);
}

async function postJson(
  url: string,
  body: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}

const healthStatusSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

export async function getHealth(): Promise<HealthStatus> {
  return fetchJson(`${API_URL}/health`, healthStatusSchema);
}

export async function getSingleStatus(): Promise<SingleStatus> {
  return fetchJson(`${API_URL}/elevator/single/status`, singleStatusSchema);
}

export async function requestElevator(
  floor: number,
  direction: Direction,
): Promise<void> {
  await postJson(`${API_URL}/elevator/single/request`, { floor, direction });
}

export async function requestDestination(floor: number): Promise<void> {
  await postJson(`${API_URL}/elevator/single/destination`, { floor });
}

export async function processRequests(): Promise<void> {
  const res = await fetch(`${API_URL}/elevator/single/process`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}

const elevatorStatusArraySchema = z.array(elevatorStatusSchema);

export async function getSystemStatus(): Promise<ElevatorStatus[]> {
  return fetchJson(
    `${API_URL}/elevator/system/status`,
    elevatorStatusArraySchema,
  );
}

export async function requestSystemTrip(
  pickupFloor: number,
  destinationFloor: number,
): Promise<void> {
  await postJson(`${API_URL}/elevator/system/trip`, {
    pickupFloor,
    destinationFloor,
  });
}

export async function getEnterpriseStatus(): Promise<
  EnterpriseElevatorStatus[]
> {
  const schema = z.array(enterpriseElevatorStatusSchema);
  return fetchJson(`${API_URL}/elevator/enterprise/status`, schema);
}

export async function getEnterpriseAnalytics(): Promise<ElevatorAnalytics> {
  const result = await fetchJson(
    `${API_URL}/elevator/enterprise/analytics`,
    elevatorAnalyticsSchema,
  );
  return result as ElevatorAnalytics;
}

export async function requestEnterpriseTrip(
  pickupFloor: number,
  destinationFloor: number,
  isVip = false,
): Promise<void> {
  await postJson(`${API_URL}/elevator/enterprise/trip`, {
    pickupFloor,
    destinationFloor,
    isVip,
  });
}

export async function setMaintenance(
  id: number,
  enabled: boolean,
): Promise<void> {
  await postJson(`${API_URL}/elevator/enterprise/maintenance/${id}`, {
    enabled,
  });
}

export async function emergencyStop(id: number): Promise<void> {
  const res = await fetch(
    `${API_URL}/elevator/enterprise/emergency-stop/${id}`,
    {
      method: "POST",
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}

export async function clearEmergency(id: number): Promise<void> {
  const res = await fetch(
    `${API_URL}/elevator/enterprise/clear-emergency/${id}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
}
