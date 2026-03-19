# Elevator Challenge — Frontend

React dashboard for the Elevator Challenge API: visualizes single-elevator (Easy), multi-elevator (Medium), and enterprise systems with real-time status, trip forms, and controls.

---

## Tech stack

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 4**
- **TanStack Router** (client-side routing)
- **TanStack Query** (API fetching, caching)
- **Radix UI** (Switch, Select, Label, Tabs)
- **Zod** (API response validation)
- **Sonner** (toasts)

---

## Routes

| Route | Description |
|-------|-------------|
| `/easy` | Single elevator (1–10 floors). Request elevator, set destination, process queue step-by-step. |
| `/medium` | 4 elevators (1–20 floors). Request trips; queue report; automatic dispatch. |
| `/enterprise` | 5 elevators with types (1–30 floors). VIP trips, maintenance toggle, emergency stop, analytics panel. |
| `/concurrency` | Stress testing: fire burst of trips to test system under load. |

---

## Project structure

```
src/
├── main.tsx              # App entry: QueryClient, Router
├── router.tsx            # TanStack Router config, route definitions
├── index.css             # Tailwind, base styles
├── api/
│   ├── elevator-api.ts   # API client (fetch, Zod validation)
│   └── elevator-api.test.ts
├── routes/
│   ├── __root.tsx        # Root layout, nav, health
│   ├── easy.tsx
│   ├── medium.tsx
│   ├── enterprise.tsx
│   └── concurrency.tsx
├── components/
│   ├── building-view.tsx     # Elevator shafts visualization
│   ├── elevator-shaft.tsx    # Single shaft + cab
│   ├── trip-form.tsx        # Pickup/destination, VIP checkbox
│   ├── queue-report.tsx     # Pending requests per elevator
│   ├── elevator-controls.tsx # Maintenance, emergency switches
│   ├── analytics-panel.tsx  # Enterprise metrics
│   ├── stress-test-panel.tsx # Concurrency fire buttons
│   ├── health-indicator.tsx # API health status
│   ├── dark-mode-toggle.tsx
│   └── ...
├── contexts/
│   ├── api-health.tsx    # Polls /health, exposes isOnline
│   └── theme.tsx         # Dark/light theme
└── types/
    └── elevator.ts       # Direction, ElevatorState, status types
e2e/
├── easy.spec.ts
├── medium.spec.ts
├── enterprise.spec.ts
├── concurrency.spec.ts
├── health.spec.ts
└── global.spec.ts
```

---

## Configuration

Create `.env` (or copy `.env.example`):

```
VITE_API_URL=http://localhost:5050
```

Defaults to `http://localhost:5050` if unset.

---

## How to run

```bash
# From project root (starts API + web)
npm run dev

# From src/web (frontend only)
cd src/web && npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5050 (must be running for full functionality)

---

## Tests

```bash
# Unit (Vitest)
npm run test:unit

# E2E (Playwright — requires dev server)
npm run test:e2e
```

E2E starts `npm run dev` from project root if no server is running. Install Playwright browsers: `npx playwright install chromium`.

---

## Key components

| Component | Purpose |
|-----------|---------|
| `BuildingView` | Renders elevator shafts for single/system/enterprise modes |
| `ElevatorShaft` | One shaft with floor cells and animated cab |
| `TripForm` | Pickup/destination inputs, optional VIP (enterprise) |
| `QueueReport` | Shows pending requests per elevator |
| `ElevatorControls` | Maintenance switch, emergency stop (enterprise) |
| `AnalyticsPanel` | Total trips, per-elevator stats |
