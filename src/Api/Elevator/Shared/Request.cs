namespace Api.Elevators.Shared;

/// <summary>Pickup and destination request for elevator dispatch.</summary>
public sealed class Request
{
    public int PickupFloor { get; init; }
    public int DestinationFloor { get; init; }
    public Direction Direction { get; init; }
    public long Timestamp { get; init; }
    /// <summary>VIP requests get priority over regular requests.</summary>
    public bool IsVip { get; init; }

    public static Request Create(int pickupFloor, int destinationFloor, bool isVip = false, DateTimeOffset? timestamp = null)
    {
        var direction = destinationFloor >= pickupFloor ? Direction.Up : Direction.Down;
        return new Request
        {
            PickupFloor = pickupFloor,
            DestinationFloor = destinationFloor,
            Direction = direction,
            Timestamp = (timestamp ?? DateTimeOffset.UtcNow).ToUnixTimeMilliseconds(),
            IsVip = isVip
        };
    }

    public static Request Pickup(int floor, Direction direction, bool isVip = false, DateTimeOffset? timestamp = null) =>
        new()
        {
            PickupFloor = floor,
            DestinationFloor = floor,
            Direction = direction,
            Timestamp = (timestamp ?? DateTimeOffset.UtcNow).ToUnixTimeMilliseconds(),
            IsVip = isVip
        };
}
