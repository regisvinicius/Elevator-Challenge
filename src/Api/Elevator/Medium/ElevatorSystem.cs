using System.Collections.Concurrent;
using Api.Elevators.Shared;

namespace Api.Elevators.Medium;

/// <summary>
/// Medium level: Multi-elevator system with intelligent dispatch.
/// 3-5 elevators, floors 1-20, thread-safe, load balancing.
/// </summary>
public sealed class ElevatorSystem
{
    private readonly Elevator[] _elevators;
    private readonly ElevatorDispatcher _dispatcher;
    private readonly ITimeProvider _time;
    private readonly ConcurrentQueue<Request> _requestQueue = new();
    private readonly ConcurrentDictionary<int, DateTimeOffset> _lastProgressAt = new();
    private readonly CancellationTokenSource _cts = new();
    private readonly TimeSpan _stuckTimeout;
    private readonly int _minFloor = 1;
    private readonly int _maxFloor = 20;
    private readonly Action<string>? _logger;
    private Task? _processorTask;

    public ElevatorSystem(int elevatorCount = 4, Action<string>? logger = null, TimeSpan? stuckTimeout = null, ITimeProvider? time = null)
    {
        _logger = logger;
        _time = time ?? SystemTimeProvider.Instance;
        _dispatcher = new ElevatorDispatcher(_time);
        _stuckTimeout = stuckTimeout ?? TimeSpan.FromSeconds(30);
        elevatorCount = Math.Clamp(elevatorCount, 3, 5);
        _elevators = Enumerable.Range(1, elevatorCount)
            .Select(i => new Elevator(i, _minFloor, _maxFloor, s => Log($"[E{i}] {s}")))
            .ToArray();
    }

    public void AssignRequest(Request request)
    {
        ValidateRequest(request);
        _requestQueue.Enqueue(request);
        Log($"Request queued: pickup={request.PickupFloor} dest={request.DestinationFloor} dir={request.Direction} (queue depth: {_requestQueue.Count})");
    }

    /// <summary>Returns the best elevator for the given request (distance + direction + load). Spec: findBestElevator().</summary>
    public Elevator? FindBestElevator(Request request) => _dispatcher.SelectBest(_elevators, request);

    /// <summary>Assigns queued requests to elevators using load-aware selection. Spec: balanceLoad().</summary>
    public void BalanceLoad()
    {
        var assigned = 0;
        var queueDepth = _requestQueue.Count;
        while (_requestQueue.TryDequeue(out var request))
        {
            var elevator = _dispatcher.SelectBest(_elevators, request);
            if (elevator is not null)
            {
                var snapshot = elevator.GetSnapshot();
                elevator.AddRequest(request);
                assigned++;
                Log($"Assigned pickup={request.PickupFloor} dest={request.DestinationFloor} → elevator {elevator.Id} (floor={snapshot.CurrentFloor} pending={snapshot.PendingRequestCount})");
            }
            else
            {
                _requestQueue.Enqueue(request);
                Log($"BalanceLoad: no elevator available, requeued pickup={request.PickupFloor} dest={request.DestinationFloor} (queue depth: {_requestQueue.Count})");
                break;
            }
        }
        if (assigned > 0)
            Log($"BalanceLoad: assigned {assigned} request(s) from queue depth {queueDepth}");
    }

    public void RequestElevator(int pickupFloor, Direction direction)
    {
        var request = Request.Pickup(pickupFloor, direction);
        AssignRequest(request);
    }

    public void RequestTrip(int pickupFloor, int destinationFloor)
    {
        var request = Request.Create(pickupFloor, destinationFloor);
        AssignRequest(request);
    }

    public void StartProcessing()
    {
        _processorTask = Task.Run(async () => await ProcessRequestsLoop(_cts.Token));
        Log("Request processor started");
    }

    public void Stop()
    {
        Log("Stopping processor...");
        _cts.Cancel();
        try { _processorTask?.Wait(TimeSpan.FromSeconds(5)); }
        catch (AggregateException ex) when (ex.InnerException is OperationCanceledException) { /* expected */ }
        catch (OperationCanceledException) { /* expected */ }
        Log($"Processor stopped. Queue depth: {_requestQueue.Count}");
    }

    public ElevatorStatus[] GetStatus() =>
        _elevators.Select(e =>
        {
            var s = e.GetSnapshot();
            return new ElevatorStatus(s.Id, s.CurrentFloor, s.State, s.PendingRequestCount, s.TargetFloors);
        }).ToArray();

    private async Task ProcessRequestsLoop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                BalanceLoad();
                ProcessAllElevators();
            }
            catch (Exception ex)
            {
                Log($"[Concurrent] Unhandled exception: {ex.Message}");
            }
            await Task.Delay(100, ct);
        }
    }

    private void ProcessAllElevators()
    {
        var now = _time.UtcNow;
        foreach (var elevator in _elevators)
        {
            if (elevator.State == ElevatorState.Maintenance)
                continue;

            if (elevator.TryGetNextTarget(out var target))
            {
                var lastProgress = _lastProgressAt.GetOrAdd(elevator.Id, now);
                if ((now - lastProgress) > _stuckTimeout)
                {
                    Log($"Elevator {elevator.Id} stuck (timeout {_stuckTimeout.TotalSeconds}s) at floor {elevator.CurrentFloor}, clearing target {target}");
                    elevator.CompleteCurrentTarget();
                    _lastProgressAt[elevator.Id] = now;
                    continue;
                }

                if (elevator.CurrentFloor < target)
                    elevator.MoveUp();
                else if (elevator.CurrentFloor > target)
                    elevator.MoveDown();
                else
                {
                    Log($"Elevator {elevator.Id} arrived at floor {target}");
                    elevator.OpenDoor();
                    elevator.CompleteCurrentTarget();
                    elevator.CloseDoor();
                    Log($"Elevator {elevator.Id} door closed at floor {target}");
                }
                _lastProgressAt[elevator.Id] = now;
            }
            else
            {
                elevator.SetIdle();
            }
        }
    }

    private void ValidateRequest(Request request)
    {
        if (request.PickupFloor < _minFloor || request.PickupFloor > _maxFloor)
            throw new ArgumentOutOfRangeException(nameof(request), $"Pickup floor must be {_minFloor}-{_maxFloor}");
        if (request.DestinationFloor < _minFloor || request.DestinationFloor > _maxFloor)
            throw new ArgumentOutOfRangeException(nameof(request), $"Destination floor must be {_minFloor}-{_maxFloor}");
    }

    private void Log(string message) => _logger?.Invoke($"[System] {message}");
}

public record ElevatorStatus(
    int Id,
    int CurrentFloor,
    ElevatorState State,
    int PendingRequestCount,
    int[] TargetFloors
);
