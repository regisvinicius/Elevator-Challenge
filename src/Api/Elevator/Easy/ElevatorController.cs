using Api.Elevators.Shared;

namespace Api.Elevators.Easy;

/// <summary>
/// Easy level: Single elevator controller with FIFO scheduling.
/// Serves floors 1-10.
/// </summary>
public sealed class ElevatorController
{
    private readonly Elevator _elevator;
    private readonly int _minFloor = 1;
    private readonly int _maxFloor = 10;
    private readonly Action<string>? _logger;

    public ElevatorController(Action<string>? logger = null)
    {
        _logger = logger;
        _elevator = new Elevator(1, _minFloor, _maxFloor, _logger);
    }

    public void RequestElevator(int floor, Direction direction)
    {
        if (floor < _minFloor || floor > _maxFloor)
            throw new ArgumentOutOfRangeException(nameof(floor), $"Floor must be between {_minFloor} and {_maxFloor}");

        var request = Request.Pickup(floor, direction);
        _elevator.AddRequest(request);
        Log($"Elevator requested at floor {floor}, direction {direction}");
    }

    public void RequestDestination(int floor)
    {
        if (floor < _minFloor || floor > _maxFloor)
            throw new ArgumentOutOfRangeException(nameof(floor), $"Floor must be between {_minFloor} and {_maxFloor}");
        _elevator.AddRequest(floor);
    }

    public async Task ProcessRequestsAsync(CancellationToken ct = default)
    {
        while (_elevator.TryDequeueNextTarget(out var target))
        {
            await ProcessTargetAsync(target, ct);
        }
        _elevator.SetIdle();
    }

    private async Task ProcessTargetAsync(int target, CancellationToken ct)
    {
        const int msPerFloor = 400;
        while (_elevator.CurrentFloor != target)
        {
            if (_elevator.CurrentFloor < target)
                _elevator.MoveUp();
            else
                _elevator.MoveDown();
            await Task.Delay(msPerFloor, ct);
        }

        _elevator.OpenDoor();
        _elevator.CloseDoor();
        await Task.Delay(300, ct);
    }

    public ElevatorState Status => _elevator.State;
    public int CurrentFloor => _elevator.CurrentFloor;

    private void Log(string message) => _logger?.Invoke($"[Controller] {message}");
}
