using Api.Elevators.Shared;

namespace Api.Tests;

/// <summary>Time provider that advances by a fixed amount on each UtcNow read. Used for deterministic stuck-timeout tests.</summary>
internal sealed class AutoAdvancingTimeProvider : ITimeProvider
{
    private readonly object _lock = new();
    private readonly long _advanceTicks;
    private long _ticks;

    public AutoAdvancingTimeProvider(TimeSpan advancePerRead)
    {
        _advanceTicks = advancePerRead.Ticks;
        _ticks = DateTimeOffset.UtcNow.Ticks;
    }

    public DateTimeOffset UtcNow
    {
        get
        {
            lock (_lock)
            {
                var result = new DateTimeOffset(_ticks, TimeSpan.Zero);
                _ticks += _advanceTicks;
                return result;
            }
        }
    }
}
