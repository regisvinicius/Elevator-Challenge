namespace Api.Elevators.Shared;

/// <summary>Default time provider using system clock.</summary>
public sealed class SystemTimeProvider : ITimeProvider
{
    public static readonly SystemTimeProvider Instance = new();
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
