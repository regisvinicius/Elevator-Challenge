namespace Api.Elevators.Hard;

/// <summary>Elevator type determines floor restrictions (e.g. Express serves fewer floors).</summary>
public enum ElevatorType
{
    Local,   // Serves all floors
    Express, // Skips intermediate floors (e.g., lobby, mid, top only)
    Freight  // Heavier capacity, may have floor restrictions
}
