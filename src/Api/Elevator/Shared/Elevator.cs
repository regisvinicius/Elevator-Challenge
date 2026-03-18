using Api.Elevators.Shared;

namespace Api.Elevators.Shared;

/// <summary>Base elevator for FIFO scheduling. Used by ElevatorController (Easy) and ElevatorSystem (Medium).</summary>
public sealed class Elevator
{
    private readonly object _lock = new();
    private readonly int _minFloor;
    private readonly int _maxFloor;
    private readonly Queue<int> _targetFloors = new();
    private readonly HashSet<int> _targetFloorsSet = new();
    private readonly Action<string>? _logger;

    public int Id { get; }
    public int CurrentFloor { get; private set; }
    public ElevatorState State { get; private set; } = ElevatorState.Idle;

    public Elevator(int id, int minFloor, int maxFloor, Action<string>? logger = null)
    {
        Id = id;
        _minFloor = minFloor;
        _maxFloor = maxFloor;
        _logger = logger;
        CurrentFloor = minFloor;
    }

    public void AddRequest(int floor)
    {
        if (floor < _minFloor || floor > _maxFloor)
            throw new ArgumentOutOfRangeException(nameof(floor), $"Floor must be between {_minFloor} and {_maxFloor}");

        lock (_lock)
        {
            if (_targetFloorsSet.Add(floor))
            {
                _targetFloors.Enqueue(floor);
                Log($"Request added for floor {floor}");
            }
        }
    }

    public void AddRequest(Request request)
    {
        lock (_lock)
        {
            AddRequestNoLock(request.PickupFloor);
            if (request.DestinationFloor != request.PickupFloor)
                AddRequestNoLock(request.DestinationFloor);
        }
    }

    private void AddRequestNoLock(int floor)
    {
        if (floor < _minFloor || floor > _maxFloor)
            throw new ArgumentOutOfRangeException(nameof(floor), $"Floor must be between {_minFloor} and {_maxFloor}");
        if (_targetFloorsSet.Add(floor))
            _targetFloors.Enqueue(floor);
    }

    public bool TryGetNextTarget(out int floor)
    {
        lock (_lock)
        {
            return _targetFloors.TryPeek(out floor!);
        }
    }

    /// <summary>Atomically claim and remove the next target. Avoids Peek+Dequeue race.</summary>
    public bool TryDequeueNextTarget(out int floor)
    {
        lock (_lock)
        {
            if (!_targetFloors.TryDequeue(out floor))
                return false;
            _targetFloorsSet.Remove(floor);
            return true;
        }
    }

    public void CompleteCurrentTarget()
    {
        lock (_lock)
        {
            if (_targetFloors.TryDequeue(out var floor))
                _targetFloorsSet.Remove(floor);
        }
    }

    public void MoveUp()
    {
        if (CurrentFloor < _maxFloor)
        {
            State = ElevatorState.MovingUp;
            CurrentFloor++;
            Log($"Moving up to floor {CurrentFloor}");
        }
    }

    public void MoveDown()
    {
        if (CurrentFloor > _minFloor)
        {
            State = ElevatorState.MovingDown;
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

    public int PendingRequestCount
    {
        get { lock (_lock) return _targetFloors.Count; }
    }

    public IReadOnlyCollection<int> TargetFloors
    {
        get { lock (_lock) return _targetFloors.ToArray(); }
    }

    /// <summary>Thread-safe snapshot for GetStatus and scoring from another thread.</summary>
    public ElevatorSnapshot GetSnapshot()
    {
        lock (_lock)
        {
            return new ElevatorSnapshot(
                Id,
                CurrentFloor,
                State,
                _targetFloors.Count,
                _targetFloors.ToArray());
        }
    }

    public void SetIdle() => State = ElevatorState.Idle;

    private void Log(string message) => _logger?.Invoke($"[Elevator {Id}] {message}");
}

/// <summary>Thread-safe snapshot of elevator state for GetStatus and scoring.</summary>
public record ElevatorSnapshot(
    int Id,
    int CurrentFloor,
    ElevatorState State,
    int PendingRequestCount,
    int[] TargetFloors);
