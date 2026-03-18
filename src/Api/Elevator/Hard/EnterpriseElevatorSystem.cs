using System.Collections.Concurrent;
using Api.Elevators.Shared;

namespace Api.Elevators.Hard;

/// <summary>
/// Hard level: Enterprise system with elevator types, LOOK algorithm,
/// floor restrictions, VIP access, maintenance, emergency stop, analytics.
/// </summary>
public sealed class EnterpriseElevatorSystem
{
    private readonly EnterpriseElevator[] _elevators;
    private readonly ConcurrentQueue<Request> _requestQueue = new();
    private readonly ConcurrentQueue<Request> _vipQueue = new();
    private readonly CancellationTokenSource _cts = new();
    private readonly int _minFloor = 1;
    private readonly int _maxFloor = 30;
    private readonly TimeSpan _stuckTimeout;
    private readonly ITimeProvider _time;
    private readonly ConcurrentDictionary<int, DateTimeOffset> _lastProgressAt = new();
    private readonly Action<string>? _logger;
    private readonly PerformanceMetrics _metrics = new();
    private Task? _processorTask;

    public EnterpriseElevatorSystem(Action<string>? logger = null, TimeSpan? stuckTimeout = null, ITimeProvider? time = null)
    {
        _logger = logger;
        _time = time ?? SystemTimeProvider.Instance;
        _stuckTimeout = stuckTimeout ?? TimeSpan.FromSeconds(30);
        _elevators = CreateElevatorFleet();
    }

    internal EnterpriseElevatorSystem(EnterpriseElevator[] elevators, Action<string>? logger = null, TimeSpan? stuckTimeout = null, ITimeProvider? time = null)
    {
        _logger = logger;
        _time = time ?? SystemTimeProvider.Instance;
        _stuckTimeout = stuckTimeout ?? TimeSpan.FromSeconds(30);
        _elevators = elevators;
    }

    private EnterpriseElevator[] CreateElevatorFleet()
    {
        var list = new List<EnterpriseElevator>();
        var allFloors = Enumerable.Range(_minFloor, _maxFloor).ToArray();
        var expressFloors = new[] { 1, 10, 20, 30 }; // Lobby, mid, top

        list.Add(new EnterpriseElevator(1, ElevatorType.Local, _minFloor, _maxFloor, null, s => Log(s)));
        list.Add(new EnterpriseElevator(2, ElevatorType.Local, _minFloor, _maxFloor, null, s => Log(s)));
        list.Add(new EnterpriseElevator(3, ElevatorType.Express, _minFloor, _maxFloor, expressFloors, s => Log(s)));
        list.Add(new EnterpriseElevator(4, ElevatorType.Freight, _minFloor, _maxFloor, allFloors, s => Log(s)));
        list.Add(new EnterpriseElevator(5, ElevatorType.Express, _minFloor, _maxFloor, expressFloors, s => Log(s)));

        return list.ToArray();
    }

    public void AssignRequest(Request request)
    {
        ValidateRequest(request);
        if (request.IsVip)
            _vipQueue.Enqueue(request);
        else
            _requestQueue.Enqueue(request);
        Log($"Request queued: pickup={request.PickupFloor} dest={request.DestinationFloor} dir={request.Direction} vip={request.IsVip} (vipQueue={_vipQueue.Count} regularQueue={_requestQueue.Count})");
    }

    public void RequestElevator(int pickupFloor, Direction direction, bool isVip = false)
    {
        AssignRequest(Request.Pickup(pickupFloor, direction, isVip));
    }

    public void RequestTrip(int pickupFloor, int destinationFloor, bool isVip = false)
    {
        AssignRequest(Request.Create(pickupFloor, destinationFloor, isVip));
    }

    public void SetMaintenance(int elevatorId, bool on)
    {
        GetElevator(elevatorId).SetMaintenance(on);
        Log($"Maintenance elevator {elevatorId}: {(on ? "enabled" : "disabled")}");
    }

    public void EmergencyStop(int elevatorId)
    {
        GetElevator(elevatorId).EmergencyStop();
        Log($"Emergency stop triggered for elevator {elevatorId}");
    }

    public void ClearEmergency(int elevatorId)
    {
        GetElevator(elevatorId).ClearEmergency();
        Log($"Emergency cleared for elevator {elevatorId}");
    }

    private EnterpriseElevator GetElevator(int elevatorId) =>
        _elevators.FirstOrDefault(x => x.Id == elevatorId)
        ?? throw new ArgumentOutOfRangeException(nameof(elevatorId), $"Elevator {elevatorId} not found");

    public void StartProcessing()
    {
        _processorTask = Task.Run(async () => await ProcessRequestsLoop(_cts.Token));
        Log("Enterprise processor started");
    }

    public void Stop()
    {
        Log("Stopping enterprise processor...");
        _cts.Cancel();
        try { _processorTask?.Wait(TimeSpan.FromSeconds(5)); }
        catch (AggregateException ex) when (ex.InnerException is OperationCanceledException) { }
        catch (OperationCanceledException) { }
        Log($"Enterprise processor stopped. vipQueue={_vipQueue.Count} regularQueue={_requestQueue.Count}");
    }

    public EnterpriseElevatorStatus[] GetStatus() =>
        _elevators.Select(e =>
        {
            var s = e.GetSnapshot();
            return new EnterpriseElevatorStatus(s.Id, s.Type, s.CurrentFloor, s.State, s.PendingRequestCount, s.TargetFloors, s.AllowedFloors);
        }).ToArray();

    public ElevatorAnalytics GetAnalytics() => _metrics.Snapshot();

    private async Task ProcessRequestsLoop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            try
            {
                var request = TryDequeueRequest(); // VIP first
                if (request is not null)
                {
                    var elevator = FindBestElevator(request);
                    if (elevator is not null)
                    {
                        var s = elevator.GetSnapshot();
                        elevator.AddRequest(request);
                        Log($"Assigned pickup={request.PickupFloor} dest={request.DestinationFloor} vip={request.IsVip} → elevator {elevator.Id} ({elevator.Type}) floor={s.CurrentFloor} pending={s.PendingRequestCount}");
                    }
                    else
                    {
                        if (CanAnyElevatorEverServe(request))
                            RequeueRequest(request);
                        else
                            Log($"Request dropped (unserviceable): pickup={request.PickupFloor} dest={request.DestinationFloor} - no elevator serves both floors");
                        await Task.Delay(50, ct);
                    }
                }

                ProcessAllElevators();
            }
            catch (Exception ex)
            {
                Log($"[Concurrent] Unhandled exception: {ex.Message}");
            }
            await Task.Delay(100, ct);
        }
    }

    private Request? TryDequeueRequest()
    {
        if (_vipQueue.TryDequeue(out var vip)) return vip;
        if (_requestQueue.TryDequeue(out var req)) return req;
        return null;
    }

    private void RequeueRequest(Request request)
    {
        if (request.IsVip) _vipQueue.Enqueue(request);
        else _requestQueue.Enqueue(request);
    }

    /// <summary>True if any elevator (by floor restrictions) could ever serve both pickup and destination.</summary>
    private bool CanAnyElevatorEverServe(Request request)
    {
        return _elevators.Any(e =>
            e.AllowedFloors.Contains(request.PickupFloor) &&
            e.AllowedFloors.Contains(request.DestinationFloor));
    }

    private EnterpriseElevator? FindBestElevator(Request request)
    {
        return _elevators
            .Select(e => (Elevator: e, Snapshot: e.GetSnapshot()))
            .Where(x => x.Snapshot.State is not ElevatorState.Maintenance and not ElevatorState.EmergencyStopped)
            .Where(x => x.Elevator.CanServeFloor(request.PickupFloor) && x.Elevator.CanServeFloor(request.DestinationFloor))
            .OrderBy(x => ScoreElevator(x.Snapshot, request))
            .Select(x => x.Elevator)
            .FirstOrDefault();
    }

    private static int ScoreElevator(EnterpriseElevatorSnapshot s, Request request)
    {
        var distance = Math.Abs(s.CurrentFloor - request.PickupFloor);
        var sameDirectionBonus = (s.State == ElevatorState.MovingUp && request.Direction == Direction.Up && request.PickupFloor >= s.CurrentFloor) ||
            (s.State == ElevatorState.MovingDown && request.Direction == Direction.Down && request.PickupFloor <= s.CurrentFloor)
            ? -100 : 0;
        var loadPenalty = s.PendingRequestCount * 10;
        var vipPenalty = request.IsVip ? -50 : 0;
        return distance + sameDirectionBonus + loadPenalty + vipPenalty;
    }

    private void ProcessAllElevators()
    {
        var now = _time.UtcNow;
        foreach (var elevator in _elevators)
        {
            if (elevator.State is ElevatorState.Maintenance or ElevatorState.EmergencyStopped)
                continue;

            if (elevator.TryGetNextTarget(out var target))
            {
                var lastProgress = _lastProgressAt.GetOrAdd(elevator.Id, now);
                if ((now - lastProgress) > _stuckTimeout)
                {
                    Log($"Elevator {elevator.Id} stuck (timeout {_stuckTimeout.TotalSeconds}s) at floor {elevator.CurrentFloor}, clearing target {target}");
                    elevator.CompleteCurrentTarget(target);
                    _lastProgressAt[elevator.Id] = now;
                    continue;
                }

                if (elevator.CurrentFloor < target)
                    elevator.MoveUp();
                else if (elevator.CurrentFloor > target)
                    elevator.MoveDown();
                else
                {
                    Log($"Elevator {elevator.Id} ({elevator.Type}) arrived at floor {target}");
                    elevator.OpenDoor();
                    elevator.CompleteCurrentTarget(target);
                    elevator.CloseDoor();
                    _metrics.RecordTripCompleted(elevator.Id);
                    Log($"Elevator {elevator.Id} door closed, trip completed");
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

    private void Log(string message) => _logger?.Invoke($"[Enterprise] {message}");
}

public record EnterpriseElevatorStatus(
    int Id,
    ElevatorType Type,
    int CurrentFloor,
    ElevatorState State,
    int PendingRequestCount,
    int[] TargetFloors,
    int[] AllowedFloors
);
