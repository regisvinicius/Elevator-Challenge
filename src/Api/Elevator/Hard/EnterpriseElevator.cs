using Api.Elevators.Shared;

namespace Api.Elevators.Hard;

/// <summary>
/// Hard level: Enterprise elevator with type, floor restrictions, maintenance, emergency stop.
/// Uses LOOK algorithm for scheduling.
/// </summary>
public sealed class EnterpriseElevator
{
    private readonly object _lock = new();
    private readonly SortedSet<int> _targetFloors = [];
    private readonly HashSet<int> _allowedFloors;
    private readonly int _minFloor;
    private readonly int _maxFloor;
    private readonly Action<string>? _logger;

    public int Id { get; }
    public ElevatorType Type { get; }
    public int CurrentFloor { get; private set; }
    public ElevatorState State { get; private set; } = ElevatorState.Idle;
    public Direction CurrentDirection { get; private set; } = Direction.Up;
    public IReadOnlyCollection<int> AllowedFloors => _allowedFloors;
    public int PendingRequestCount { get { lock (_lock) return _targetFloors.Count; } }

    public EnterpriseElevator(int id, ElevatorType type, int minFloor, int maxFloor, IReadOnlyCollection<int>? allowedFloors = null, Action<string>? logger = null)
    {
        Id = id;
        Type = type;
        _minFloor = minFloor;
        _maxFloor = maxFloor;
        _logger = logger;
        _allowedFloors = allowedFloors is not null
            ? [.. allowedFloors]
            : [.. Enumerable.Range(_minFloor, _maxFloor - _minFloor + 1)];
        CurrentFloor = _minFloor;
    }

    public void SetMaintenance(bool enabled)
    {
        lock (_lock)
        {
            State = enabled ? ElevatorState.Maintenance : ElevatorState.Idle;
            Log($"Maintenance {(enabled ? "enabled" : "disabled")}");
        }
    }

    public void EmergencyStop()
    {
        lock (_lock)
        {
            State = ElevatorState.EmergencyStopped;
            Log("EMERGENCY STOP");
        }
    }

    public void ClearEmergency()
    {
        lock (_lock)
        {
            if (State == ElevatorState.EmergencyStopped)
            {
                State = ElevatorState.Idle;
                Log("Emergency cleared");
            }
        }
    }

    public bool CanServeFloor(int floor) =>
        State is not ElevatorState.Maintenance and not ElevatorState.EmergencyStopped &&
        floor >= _minFloor && floor <= _maxFloor && _allowedFloors.Contains(floor);

    public void AddRequest(Request request)
    {
        lock (_lock)
        {
            if (CanServeFloor(request.PickupFloor)) _targetFloors.Add(request.PickupFloor);
            if (request.DestinationFloor != request.PickupFloor && CanServeFloor(request.DestinationFloor))
                _targetFloors.Add(request.DestinationFloor);
        }
    }

    /// <summary>LOOK algorithm: next target in current direction, or reverse if none. If already on a target floor, return it (arrived).</summary>
    public bool TryGetNextTarget(out int floor)
    {
        lock (_lock)
        {
            if (_targetFloors.Count == 0) { floor = 0; return false; }

            // Already at a target floor - we've arrived
            if (_targetFloors.Contains(CurrentFloor)) { floor = CurrentFloor; return true; }

            if (CurrentDirection == Direction.Up)
            {
                var next = _targetFloors.FirstOrDefault(f => f > CurrentFloor);
                if (next != 0) { floor = next; return true; }
                var downNext = _targetFloors.Max();
                if (downNext < CurrentFloor) { CurrentDirection = Direction.Down; floor = downNext; return true; }
                floor = _targetFloors.Min();
                CurrentDirection = Direction.Down;
                return true;
            }
            else
            {
                var next = _targetFloors.LastOrDefault(f => f < CurrentFloor);
                if (next != 0) { floor = next; return true; }
                var upNext = _targetFloors.Min();
                if (upNext > CurrentFloor) { CurrentDirection = Direction.Up; floor = upNext; return true; }
                floor = _targetFloors.Max();
                CurrentDirection = Direction.Up;
                return true;
            }
        }
    }

    public void CompleteCurrentTarget(int floor)
    {
        lock (_lock) { _targetFloors.Remove(floor); }
    }

    public void MoveUp()
    {
        if (CurrentFloor < _maxFloor && State is not ElevatorState.EmergencyStopped and not ElevatorState.Maintenance)
        {
            State = ElevatorState.MovingUp;
            CurrentDirection = Direction.Up;
            CurrentFloor++;
            Log($"Moving up to floor {CurrentFloor}");
        }
    }

    public void MoveDown()
    {
        if (CurrentFloor > _minFloor && State is not ElevatorState.EmergencyStopped and not ElevatorState.Maintenance)
        {
            State = ElevatorState.MovingDown;
            CurrentDirection = Direction.Down;
            CurrentFloor--;
            Log($"Moving down to floor {CurrentFloor}");
        }
    }

    public void OpenDoor()
    {
        State = ElevatorState.DoorOpening;
        Log("Door opening");
        State = ElevatorState.DoorOpen;
    }

    public void CloseDoor()
    {
        State = ElevatorState.DoorClosing;
        Log("Door closing");
        State = ElevatorState.Idle;
    }

    public void SetIdle() => State = ElevatorState.Idle;

    public IReadOnlyCollection<int> TargetFloors
    {
        get { lock (_lock) return _targetFloors.ToArray(); }
    }

    /// <summary>Thread-safe snapshot for GetStatus and scoring.</summary>
    public EnterpriseElevatorSnapshot GetSnapshot()
    {
        lock (_lock)
        {
            return new EnterpriseElevatorSnapshot(
                Id,
                Type,
                CurrentFloor,
                State,
                _targetFloors.Count,
                _targetFloors.ToArray(),
                _allowedFloors.ToArray());
        }
    }

    private void Log(string message) => _logger?.Invoke($"[E{Id}:{Type}] {message}");
}

/// <summary>Thread-safe snapshot of enterprise elevator state.</summary>
public record EnterpriseElevatorSnapshot(
    int Id,
    ElevatorType Type,
    int CurrentFloor,
    ElevatorState State,
    int PendingRequestCount,
    int[] TargetFloors,
    int[] AllowedFloors);
