namespace Api.Elevators.Shared;

/// <summary>Abstraction for time to enable deterministic testing.</summary>
public interface ITimeProvider
{
    DateTimeOffset UtcNow { get; }
}
