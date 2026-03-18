using System.Collections.Concurrent;

namespace Api.Elevators.Hard;

public sealed class PerformanceMetrics
{
    private readonly ConcurrentDictionary<int, long> _tripsCompleted = new();
    private long _totalTripsCompleted;

    public long TotalTripsCompleted => _totalTripsCompleted;
    public IReadOnlyDictionary<int, long> TripsByElevator => _tripsCompleted.ToDictionary(k => k.Key, v => v.Value);

    public void RecordTripCompleted(int elevatorId)
    {
        _tripsCompleted.AddOrUpdate(elevatorId, 1, (_, c) => c + 1);
        Interlocked.Increment(ref _totalTripsCompleted);
    }

    public ElevatorAnalytics Snapshot()
    {
        var byElevator = _tripsCompleted.Keys.ToDictionary(
            k => k,
            k => new ElevatorAnalyticsEntry(
                _tripsCompleted.TryGetValue(k, out var t) ? t : 0,
                0));
        return new ElevatorAnalytics(
            Interlocked.Read(ref _totalTripsCompleted),
            0,
            byElevator);
    }
}

public record ElevatorAnalytics(
    long TotalTripsCompleted,
    double AverageWaitTimeMs,
    IReadOnlyDictionary<int, ElevatorAnalyticsEntry> ByElevator);

public record ElevatorAnalyticsEntry(long TripsCompleted, double AverageWaitTimeMs);
