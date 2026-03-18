# Elevator Challenge — Backend API

API .NET minimal (ASP.NET Core 10) que implementa um sistema de elevadores em três níveis de complexidade: Easy (1 elevador), Medium (múltiplos elevadores) e Hard (enterprise com tipos, VIP e manutenção).

---

## Tech stack

- **.NET 10**
- **ASP.NET Core** (Minimal APIs)
- **Swagger/OpenAPI** (Swashbuckle)
- **CORS** habilitado para frontend em `http://localhost:5173`

---

## Arquitetura

O backend expõe **três subsistemas** em paralelo, cada um correspondendo a um nível do desafio:

| Nível | Subsistema | Andares | Elevadores | Algoritmo |
|-------|-------------|---------|------------|-----------|
| **Easy** | Single elevator | 1–10 | 1 | FIFO |
| **Medium** | Multi-elevator | 1–20 | 4 | Dispatcher (distância + direção + carga) |
| **Hard** | Enterprise | 1–30 | 5 (tipos mistos) | LOOK + prioridade VIP |

---

## Estrutura de pastas

```
Api/
├── Program.cs                 # Endpoints e wiring
├── Elevator/
│   ├── Easy/
│   │   └── ElevatorController.cs   # 1 elevador, FIFO
│   ├── Medium/
│   │   ├── ElevatorSystem.cs       # 4 elevadores, dispatch
│   │   └── ElevatorDispatcher.cs   # Seleção de melhor elevador
│   ├── Hard/
│   │   ├── EnterpriseElevatorSystem.cs
│   │   ├── EnterpriseElevator.cs   # Tipos, andares restritos, LOOK
│   │   ├── ElevatorType.cs
│   │   └── PerformanceMetrics.cs
│   └── Shared/
│       ├── Direction.cs
│       ├── ElevatorState.cs
│       ├── Elevator.cs             # Elevador base
│       ├── Request.cs
│       ├── ITimeProvider.cs
│       └── SystemTimeProvider.cs
└── appsettings.json
```

---

## Endpoints

### Saúde

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Status da API + timestamp UTC |

---

### Easy — Elevador único (andares 1–10)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| `GET` | `/elevator/single/status` | — | `floor`, `state` do elevador |
| `POST` | `/elevator/single/request` | `{ floor, direction }` | Chamada no andar (Up/Down) |
| `POST` | `/elevator/single/destination` | `{ floor }` | Destino a partir do interior |
| `POST` | `/elevator/single/process` | — | Processa a fila (passo a passo) |

**Request body:** `{ "floor": 3, "direction": "Up" }` (enum `Up` / `Down`)

---

### Medium — Sistema multi-elevador (andares 1–20)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| `GET` | `/elevator/system/status` | — | Status dos 4 elevadores |
| `POST` | `/elevator/system/trip` | `{ pickupFloor, destinationFloor }` | Viagem completa |
| `POST` | `/elevator/system/request` | `{ floor, direction }` | Chamada no andar |

**Resposta de status:** `[{ id, currentFloor, state, pendingRequestCount, targetFloors }]`

---

### Hard — Enterprise (andares 1–30)

| Método | Rota | Body | Descrição |
|--------|------|------|-----------|
| `GET` | `/elevator/enterprise/status` | — | Status dos 5 elevadores (com tipo e andares permitidos) |
| `GET` | `/elevator/enterprise/analytics` | — | Métricas (total de viagens, por elevador) |
| `POST` | `/elevator/enterprise/trip` | `{ pickupFloor, destinationFloor, isVip? }` | Viagem (VIP opcional) |
| `POST` | `/elevator/enterprise/request` | `{ floor, direction, isVip? }` | Chamada no andar |
| `POST` | `/elevator/enterprise/maintenance/{id}` | `{ enabled }` | Liga/desliga manutenção |
| `POST` | `/elevator/enterprise/emergency-stop/{id}` | — | Para emergência |
| `POST` | `/elevator/enterprise/clear-emergency/{id}` | — | Cancela parada de emergência |

**Frota padrão:**

- Elevador 1, 2: `Local` (todos os andares)
- Elevador 3, 5: `Express` (1, 10, 20, 30)
- Elevador 4: `Freight` (todos os andares)

---

## Lógica de dispatch

### Easy (FIFO)

- Uma fila simples; pedidos atendidos na ordem em que chegam.

### Medium (Dispatcher)

O `ElevatorDispatcher` calcula um **score** por elevador:

- **Distância** ao andar de pickup
- **Bônus** se o elevador já estiver indo na direção do passageiro
- **Penalidade** pela carga (número de pedidos pendentes)
- **Bônus de idade** para evitar starvation de pedidos antigos

O elevador com menor score é escolhido.

### Hard (Enterprise)

- **VIP:** fila separada com prioridade
- **Tipos:** só elevadores que atendem ambos os andares (pickup e destino)
- **Score:** distância + direção + carga + prioridade VIP
- **LOOK:** próximo alvo na direção atual; inversão apenas ao não haver alvos à frente

---

## Estados do elevador

| Estado | Descrição |
|--------|-----------|
| `Idle` | Parado, sem pedidos |
| `MovingUp` | Subindo |
| `MovingDown` | Descendo |
| `DoorOpening` | Porta abrindo |
| `DoorOpen` | Porta aberta |
| `DoorClosing` | Porta fechando |
| `Maintenance` | Em manutenção (Hard) |
| `EmergencyStopped` | Parada de emergência (Hard) |

---

## Como executar

```bash
# Na raiz do projeto
dotnet run --project src/Api/Api.csproj --urls http://localhost:5050

# Ou via npm
npm run dev:api
```

- API: http://localhost:5050
- Swagger: http://localhost:5050/swagger

---

## Configuração

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `ApplicationUrl` | `http://localhost:5050` | URL da API (launchSettings) |
| CORS | `http://localhost:5173` | Origem permitida (frontend Vite) |
| Andares Easy | 1–10 | `ElevatorController` |
| Andares Medium | 1–20 | `ElevatorSystem` |
| Andares Hard | 1–30 | `EnterpriseElevatorSystem` |
| Timeout “stuck” | 30s | Reinício de elevador travado |

---

## Testes

```bash
dotnet test
```

Os testes unitários e de integração estão em `Api.Tests/` e usam `TestTimeProvider` para controlar o tempo e acelerar cenários assíncronos.
