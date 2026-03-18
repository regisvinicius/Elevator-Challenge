using Api.Elevators.Shared;

namespace Api.Elevators.Medium;

/// <summary>
/// Separates dispatching logic from elevator execution.
/// Scores elevators by distance, direction, load, and request age (starvation avoidance).
/// </summary>
public sealed class ElevatorDispatcher
{
    private readonly ITimeProvider _time;
    private const int SameDirectionBonus = -100;
    private const int LoadPenaltyPerRequest = 10;
    private const int AgeBonusPerSecond = -1; // Older requests get slight priority

    public ElevatorDispatcher(ITimeProvider? time = null)
    {
        _time = time ?? SystemTimeProvider.Instance;
    }

    public int Score(ElevatorSnapshot snapshot, Request request)
    {
        var distance = Math.Abs(snapshot.CurrentFloor - request.PickupFloor);
        var sameDirectionBonus = IsMovingToward(snapshot, request.PickupFloor, request.Direction) ? SameDirectionBonus : 0;
        var loadPenalty = snapshot.PendingRequestCount * LoadPenaltyPerRequest;
        var ageMs = _time.UtcNow.ToUnixTimeMilliseconds() - request.Timestamp;
        var ageBonus = (int)((ageMs / 1000) * AgeBonusPerSecond);
        return distance + sameDirectionBonus + loadPenalty + Math.Max(0, ageBonus);
    }

    public Elevator? SelectBest(Elevator[] elevators, Request request)
    {
        var withSnapshots = elevators
            .Select(e => (Elevator: e, Snapshot: e.GetSnapshot()))
            .Where(x => x.Snapshot.State != ElevatorState.Maintenance)
            .OrderBy(x => Score(x.Snapshot, request))
            .FirstOrDefault();
        return withSnapshots.Elevator;
    }

    private static bool IsMovingToward(ElevatorSnapshot s, int floor, Direction direction)
    {
        return s.State switch
        {
            ElevatorState.MovingUp => direction == Direction.Up && floor >= s.CurrentFloor,
            ElevatorState.MovingDown => direction == Direction.Down && floor <= s.CurrentFloor,
            _ => false
        };
    }
}
