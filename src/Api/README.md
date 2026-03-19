# Elevator Challenge — Backend API

Minimal .NET API (ASP.NET Core 10) implementing an elevator system with three levels of complexity: Easy (1 elevator), Medium (multiple elevators), and Hard (enterprise with types, VIP, and maintenance).

---

## Tech stack

- **.NET 10**
- **ASP.NET Core** (Minimal APIs)
- **Swagger/OpenAPI** (Swashbuckle)
- **CORS** enabled for frontend at `http://localhost:5173`

---

## Architecture

The backend exposes **three subsystems** in parallel, each corresponding to a challenge level:

| Level | Subsystem | Floors | Elevators | Algorithm |
|-------|-----------|--------|-----------|-----------|
| **Easy** | Single elevator | 1–10 | 1 | FIFO |
| **Medium** | Multi-elevator | 1–20 | 4 | Dispatcher (distance + direction + load) |
| **Hard** | Enterprise | 1–30 | 5 (mixed types) | LOOK + VIP priority |

---

## Project structure

```
Api/
├── Program.cs                 # Endpoints and wiring
├── Elevator/
│   ├── Easy/
│   │   └── ElevatorController.cs   # 1 elevator, FIFO
│   ├── Medium/
│   │   ├── ElevatorSystem.cs       # 4 elevators, dispatch
│   │   └── ElevatorDispatcher.cs   # Best elevator selection
│   ├── Hard/
│   │   ├── EnterpriseElevatorSystem.cs
│   │   ├── EnterpriseElevator.cs   # Types, floor restrictions, LOOK
│   │   ├── ElevatorType.cs
│   │   └── PerformanceMetrics.cs
│   └── Shared/
│       ├── Direction.cs
│       ├── ElevatorState.cs
│       ├── Elevator.cs             # Base elevator
│       ├── Request.cs
│       ├── ITimeProvider.cs
│       └── SystemTimeProvider.cs
└── appsettings.json
```

---

## Endpoints

### Health

| Method | Route | Description |
|--------|------|-------------|
| `GET` | `/health` | API status + UTC timestamp |

---

### Easy — Single elevator (floors 1–10)

| Method | Route | Body | Description |
|--------|------|------|-------------|
| `GET` | `/elevator/single/status` | — | `floor`, `state` of elevator |
| `POST` | `/elevator/single/request` | `{ floor, direction }` | Call from floor (Up/Down) |
| `POST` | `/elevator/single/destination` | `{ floor }` | Destination from inside cab |
| `POST` | `/elevator/single/process` | — | Process the queue (step-by-step) |

**Request body:** `{ "floor": 3, "direction": "Up" }` (enum `Up` / `Down`)

---

### Medium — Multi-elevator system (floors 1–20)

| Method | Route | Body | Description |
|--------|------|------|-------------|
| `GET` | `/elevator/system/status` | — | Status of all 4 elevators |
| `POST` | `/elevator/system/trip` | `{ pickupFloor, destinationFloor }` | Full trip |
| `POST` | `/elevator/system/request` | `{ floor, direction }` | Call from floor |

**Status response:** `[{ id, currentFloor, state, pendingRequestCount, targetFloors }]`

---

### Hard — Enterprise (floors 1–30)

| Method | Route | Body | Description |
|--------|------|------|-------------|
| `GET` | `/elevator/enterprise/status` | — | Status of all 5 elevators (with type and allowed floors) |
| `GET` | `/elevator/enterprise/analytics` | — | Metrics (total trips, per elevator) |
| `POST` | `/elevator/enterprise/trip` | `{ pickupFloor, destinationFloor, isVip? }` | Trip (VIP optional) |
| `POST` | `/elevator/enterprise/request` | `{ floor, direction, isVip? }` | Call from floor |
| `POST` | `/elevator/enterprise/maintenance/{id}` | `{ enabled }` | Toggle maintenance |
| `POST` | `/elevator/enterprise/emergency-stop/{id}` | — | Emergency stop |
| `POST` | `/elevator/enterprise/clear-emergency/{id}` | — | Clear emergency stop |

**Default fleet:**

- Elevators 1, 2: `Local` (all floors)
- Elevators 3, 5: `Express` (1, 10, 20, 30)
- Elevator 4: `Freight` (all floors)

---

## Dispatch logic

### Easy (FIFO)

- Single queue; requests served in the order they arrive.

### Medium (Dispatcher)

The `ElevatorDispatcher` computes a **score** per elevator:

- **Distance** to pickup floor
- **Bonus** if elevator is already moving toward the passenger
- **Penalty** for load (number of pending requests)
- **Age bonus** to avoid starvation of older requests

The elevator with the lowest score is selected.

### Hard (Enterprise)

- **VIP:** separate queue with priority
- **Types:** only elevators that serve both pickup and destination floors
- **Score:** distance + direction + load + VIP priority
- **LOOK:** next target in current direction; reverse only when no targets ahead

---

## Elevator states

| State | Description |
|--------|-------------|
| `Idle` | Stopped, no requests |
| `MovingUp` | Moving up |
| `MovingDown` | Moving down |
| `DoorOpening` | Door opening |
| `DoorOpen` | Door open |
| `DoorClosing` | Door closing |
| `Maintenance` | Under maintenance (Hard) |
| `EmergencyStopped` | Emergency stop (Hard) |

---

## How to run

```bash
# From project root
dotnet run --project src/Api/Api.csproj --urls http://localhost:5050

# Or via npm
npm run dev:api
```

- API: http://localhost:5050
- Swagger: http://localhost:5050/swagger

---

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ApplicationUrl` | `http://localhost:5050` | API URL (launchSettings) |
| CORS | `http://localhost:5173` | Allowed origin (Vite frontend) |
| Easy floors | 1–10 | `ElevatorController` |
| Medium floors | 1–20 | `ElevatorSystem` |
| Hard floors | 1–30 | `EnterpriseElevatorSystem` |
| Stuck timeout | 30s | Reset for stuck elevator |

---

## Tests

```bash
dotnet test
```

Unit and integration tests are in `Api.Tests/` and use `TestTimeProvider` to control time and speed up async scenarios.
