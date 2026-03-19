# Elevator System Challenge

A multi-level elevator control system built as a coding challenge. This project simulates real-world elevator logic across three progressively complex tiers: **Easy** (single elevator), **Medium** (multi-elevator with intelligent dispatch), and **Hard** (enterprise system with VIP, analytics, and advanced algorithms).

---

## Table of Contents

- [What is this project?](#what-is-this-project)
- [Why does it exist?](#why-does-it-exist)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Project structure](#project-structure)
- [Architecture overview](#architecture-overview)
- [The three levels explained](#the-three-levels-explained)
- [Key concepts (for juniors)](#key-concepts-for-juniors)
- [API reference](#api-reference)
- [Frontend dashboard](#frontend-dashboard)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Learning takeaways](#learning-takeaways)

---

## What is this project?

This is an **elevator control system** that:

1. **Easy mode**: Simulates a single elevator in a 10-story building using FIFO (first-in, first-out) scheduling.
2. **Medium mode**: Manages 4 elevators in a 20-story building with intelligent dispatch (assigns each request to the best elevator).
3. **Hard mode (Enterprise)**: Runs 5 elevators of different types (Local, Express, Freight) in a 30-story building, with VIP priority, maintenance/emergency controls, and performance analytics.

Each level adds complexity and real-world constraints (concurrency, thread safety, load balancing, etc.).

---

## Why does it exist?

This project was built as a **coding challenge** (often used in technical interviews) to demonstrate:

- **Domain modeling**: How to model elevators, requests, and state.
- **Concurrency**: Multiple elevators and passengers acting at the same time.
- **Thread safety**: Shared queues and state accessed by multiple threads.
- **Algorithms**: Scheduling (FIFO, LOOK), dispatch scoring, load balancing.
- **API design**: REST endpoints for status, trip requests, and control.
- **Full-stack**: .NET backend + React frontend with real-time updates.

It’s a good learning project because it touches many software engineering concepts in one place.

---

## Tech stack

| Layer       | Technology | Why? |
|------------|------------|------|
| **Backend** | ASP.NET Core 10 (C#) | Fast, minimal API, strong typing, good concurrency support. |
| **Frontend** | React 19 + Vite | Modern stack, fast dev experience. |
| **State** | TanStack Query | Handles API fetching, caching, and refetching for the dashboard. |
| **UI** | Radix UI + Tailwind | Accessible components, utility-first CSS. |
| **Routing** | TanStack Router | Type-safe routing for SPA. |
| **Testing** | xUnit (.NET), Vitest (frontend), Playwright (E2E) | Unit, integration, and browser tests. |
| **Lint/Format** | Biome + dotnet format | Consistent style and checks. |

---

## Quick start

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)

### Run everything

```bash
# Install dependencies
npm ci
npm ci --prefix src/web

# Start API (localhost:5050) + Web UI (localhost:5173)
npm run dev
```

Then open:

- **Web UI**: http://localhost:5173  
- **API docs (Swagger)**: http://localhost:5050/swagger  

### Run only API

```bash
npm run dev:api
```

### Run only frontend

```bash
npm run dev:web
```

---

## Project structure

```
Elevator-Challenge/
├── src/
│   ├── Api/                    # .NET Web API
│   │   ├── Elevator/
│   │   │   ├── Easy/           # Single-elevator (ElevatorController)
│   │   │   ├── Medium/        # Multi-elevator (ElevatorSystem)
│   │   │   ├── Hard/          # Enterprise (EnterpriseElevatorSystem)
│   │   │   └── Shared/        # Request, Direction, ElevatorState, etc.
│   │   └── Program.cs         # API endpoints
│   └── web/                   # React dashboard
│       ├── src/
│       │   ├── routes/        # Easy, Medium, Enterprise, Concurrency pages
│       │   ├── components/    # BuildingView, TripForm, QueueReport, etc.
│       │   └── api/           # API client
│       └── e2e/               # Playwright E2E tests
├── Api.Tests/                 # .NET unit & integration tests
├── .github/workflows/         # CI pipeline
└── README.md (this file)
```

---

## Architecture overview

The system is built in three tiers:

| Level | Backend class | Floors | Elevators | Scheduling |
|-------|---------------|--------|-----------|------------|
| **Easy** | `ElevatorController` + `Elevator` | 1–10 | 1 | FIFO |
| **Medium** | `ElevatorSystem` | 1–20 | 4 | Intelligent dispatch |
| **Hard** | `EnterpriseElevatorSystem` | 1–30 | 5 (mixed types) | LOOK + VIP priority |

Each level extends the previous one with more features. The frontend has a separate page for each mode.

---

## The three levels explained

### Level 1: Easy (single elevator)

- One elevator, floors 1–10.
- Passengers press “up” or “down” at a floor, then select a destination.
- Requests are processed in **FIFO** order (first come, first served).
- States: IDLE, MOVING_UP, MOVING_DOWN, DOOR_OPEN, etc.

**Why FIFO?** Simple and deterministic. Used as a baseline for the harder levels.

### Level 2: Medium (multi-elevator)

- 4 elevators, floors 1–20.
- Each request is assigned to an elevator based on:
  - Distance to pickup floor
  - Same-direction bonus (elevator going up and request going up)
  - Load (how many requests an elevator already has)

- Uses `ConcurrentQueue` for thread safety.
- Background task processes requests and moves elevators.

**Why intelligent dispatch?** To reduce wait time by choosing the best elevator, similar to real buildings.

### Level 3: Hard (enterprise)

- 5 elevators: 2 Local (all floors), 2 Express (only lobby, 10, 20, 30), 1 Freight (all floors).
- **LOOK algorithm**: Elevator keeps moving in one direction until no more requests in that direction, then reverses.
- **VIP queue**: VIP requests are processed before regular ones.
- **Maintenance** and **emergency stop** per elevator.
- **Analytics**: Trip counts, timing metrics.

**Why these features?** They reflect real constraints: express elevators for speed, maintenance for safety, VIP for priority access.

---

## Key concepts (for juniors)

### FIFO (First In, First Out)

Requests are handled in the order they arrive. The elevator processes its queue one by one. Good for single-elevator logic and for debugging; not ideal when you have multiple elevators.

### Intelligent dispatch

Instead of a single shared queue, we choose **which elevator** handles each request. We score each elevator (distance + direction + load) and assign the request to the best one.

### LOOK algorithm

- Elevator moves in one direction (e.g. up) while there are requests in that direction.
- When there are no more requests ahead, it reverses.
- More efficient than always starting from floor 1 (SCAN) because we don’t visit empty floors.

### Thread safety

Multiple passengers and elevators act at the same time. We use:

- `ConcurrentQueue` for shared queues (lock-free)
- Locks where state must be updated atomically
- Background tasks instead of blocking the main thread

### VIP priority

VIP requests go into a separate queue (`_vipQueue`). When assigning work, we take from the VIP queue before the regular queue so VIP passengers are served first.

### Stuck elevator timeout

If an elevator doesn’t move for a configured time (e.g. 30 seconds), we assume it’s stuck. The system clears the current target so the elevator can move again and requests can be reassigned.

---

## API reference

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### Easy (single elevator)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/elevator/single/status` | Current floor and state |
| POST | `/elevator/single/request` | Request elevator (floor + direction) |
| POST | `/elevator/single/destination` | Set destination floor |
| POST | `/elevator/single/process` | Process requests (one-time) |

### Medium (multi-elevator)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/elevator/system/status` | All elevators’ status |
| POST | `/elevator/system/trip` | Request trip (pickup + destination) |

### Hard (enterprise)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/elevator/enterprise/status` | Status with elevator types |
| GET | `/elevator/enterprise/analytics` | Trip metrics |
| POST | `/elevator/enterprise/trip` | Request trip (with optional `isVip`) |
| POST | `/elevator/enterprise/maintenance/{id}` | Toggle maintenance |
| POST | `/elevator/enterprise/emergency-stop/{id}` | Emergency stop |
| POST | `/elevator/enterprise/clear-emergency/{id}` | Clear emergency |

Full details: http://localhost:5050/swagger when the API is running.

---

## Frontend dashboard

The React app has four main pages:

1. **Easy**: Single elevator, request elevator / destination, process requests.
2. **Medium**: Multi-elevator view and trip form (pickup + destination).
3. **Enterprise**: 5 elevators with types, VIP checkbox, maintenance/emergency controls, analytics.
4. **Concurrency**: Stress test that sends 50+ concurrent trip requests.

The dashboard polls the API every few seconds to show elevator positions and queues in near real time.

---

## Testing

### .NET unit tests

```bash
dotnet test
```

Covers:

- Elevator behavior (movement, doors, FIFO)
- Controller and system logic
- Concurrency and thread safety
- Enterprise features (VIP, LOOK, analytics)
- Performance (e.g. 100+ concurrent requests)

### Frontend unit tests

```bash
npm run test:unit --prefix src/web
```

Runs Vitest for components and API client.

### E2E tests (Playwright)

```bash
npm run test:e2e
```

Runs browser tests against the dashboard. Requires both API and web server running (`npm run dev`). Playwright starts them automatically in CI.

---

## CI/CD

GitHub Actions runs on every push/PR to `main`:

1. Setup .NET 10 + Node 20  
2. Install dependencies  
3. Restore .NET packages  
4. Lint (Biome + dotnet format)  
5. Build (API + frontend)  
6. Unit tests (.NET + Vitest)  
7. Playwright E2E tests  

Config: `.github/workflows/main.yml`

---

## Learning takeaways

1. **Start simple**: Easy level is just a queue and a state machine. Build up from there.
2. **Concurrency needs care**: Shared state requires the right primitives (e.g. `ConcurrentQueue`, locks).
3. **Tests reduce flakiness**: Especially for timing and concurrency; polling loops are safer than fixed sleeps.
4. **APIs enable UIs**: Clear REST endpoints make it straightforward to build a monitoring dashboard.
5. **Real systems have edge cases**: Unserviceable requests, stuck elevators, VIP priority—all need explicit handling.

---

## Commands reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + Web |
| `npm run build` | Build API + Web |
| `npm run test` | .NET + frontend unit tests |
| `npm run test:e2e` | Playwright E2E |
| `npm run lint` | Biome + dotnet format (verify) |
| `npm run format` | Biome + dotnet format (auto-fix) |

---

## License

This project was created as a coding challenge. Use it for learning and reference.
