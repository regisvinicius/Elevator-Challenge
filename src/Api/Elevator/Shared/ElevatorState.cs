namespace Api.Elevators.Shared;

/// <summary>Current operational state of an elevator.</summary>
public enum ElevatorState
{
    Idle,
    MovingUp,
    MovingDown,
    DoorOpening,
    DoorOpen,
    DoorClosing,
    Maintenance,
    EmergencyStopped
}
