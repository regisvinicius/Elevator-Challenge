import type {
  ElevatorState,
  ElevatorStatus,
  EnterpriseElevatorStatus,
} from "@/types/elevator";
import { ElevatorShaft } from "./elevator-shaft";

const VALID_STATES: ElevatorState[] = [
  "Idle",
  "MovingUp",
  "MovingDown",
  "DoorOpening",
  "DoorOpen",
  "DoorClosing",
  "Maintenance",
  "EmergencyStopped",
];

function toState(s: string): ElevatorState {
  return (
    VALID_STATES.includes(s as ElevatorState) ? s : "Idle"
  ) as ElevatorState;
}

type ElevatorData =
  | { mode: "single"; floor: number; state: string }
  | {
      mode: "system";
      elevators: ElevatorStatus[];
      minFloor: number;
      maxFloor: number;
    }
  | {
      mode: "enterprise";
      elevators: EnterpriseElevatorStatus[];
      minFloor: number;
      maxFloor: number;
    };

export function BuildingView({ data }: { data: ElevatorData }) {
  if (data.mode === "single") {
    const state = toState(data.state);
    return (
      <div className="flex justify-center">
        <ElevatorShaft
          elevatorId={1}
          currentFloor={data.floor}
          state={state}
          minFloor={1}
          maxFloor={10}
          label="Elevator"
        />
      </div>
    );
  }

  const floors = Array.from(
    { length: data.maxFloor - data.minFloor + 1 },
    (_, i) => data.maxFloor - i,
  );

  const shaftGroup = (
    elevators: { id: number; currentFloor: number; state: string }[],
    labels: (e: { id: number; type?: string }) => string,
  ) => (
    <div className="flex items-start gap-4">
      <div className="flex flex-col pt-9">
        {floors.map((f) => (
          <div
            key={f}
            className="flex h-7 w-6 items-center text-xs font-medium text-slate-400 dark:text-slate-500"
          >
            {f}
          </div>
        ))}
      </div>
      <div className="flex gap-6">
        {elevators.map((e) => (
          <ElevatorShaft
            key={e.id}
            elevatorId={e.id}
            currentFloor={e.currentFloor}
            state={toState(e.state)}
            minFloor={data.minFloor}
            maxFloor={data.maxFloor}
            label={labels(e)}
            hideFloorNumbers
          />
        ))}
      </div>
    </div>
  );

  if (data.mode === "system") {
    return shaftGroup(data.elevators, (e) => `E${e.id}`);
  }

  return shaftGroup(
    data.elevators as {
      id: number;
      currentFloor: number;
      state: string;
      type?: string;
    }[],
    (e) => `E${e.id}${e.type ? ` (${e.type})` : ""}`,
  );
}
