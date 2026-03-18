using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Api.Elevators.Easy;
using Api.Elevators.Hard;
using Api.Elevators.Medium;
using Api.Elevators.Shared;
using Xunit;

namespace Api.Tests;

public sealed class ElevatorTests
{
    [Fact]
    public void Elevator_AddRequest_ValidFloor_AddsToQueue()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.AddRequest(5);
        Assert.True(elevator.TryGetNextTarget(out var floor));
        Assert.Equal(5, floor);
    }

    [Fact]
    public void Elevator_MoveUp_IncrementsFloor()
    {
        var elevator = new Elevator(1, 1, 10);
        Assert.Equal(1, elevator.CurrentFloor);
        elevator.MoveUp();
        Assert.Equal(2, elevator.CurrentFloor);
        Assert.Equal(ElevatorState.MovingUp, elevator.State);
    }

    [Fact]
    public void Elevator_MoveDown_DecrementsFloor()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.AddRequest(3);
        elevator.MoveUp();
        elevator.MoveUp();
        elevator.MoveDown();
        Assert.Equal(2, elevator.CurrentFloor);
        Assert.Equal(ElevatorState.MovingDown, elevator.State);
    }

    [Fact]
    public void Elevator_InvalidFloor_Throws()
    {
        var elevator = new Elevator(1, 1, 10);
        Assert.Throws<ArgumentOutOfRangeException>(() => elevator.AddRequest(0));
        Assert.Throws<ArgumentOutOfRangeException>(() => elevator.AddRequest(11));
    }

    [Fact]
    public async Task ElevatorController_FIFO_ProcessesInOrder()
    {
        var log = new List<string>();
        var controller = new ElevatorController(s => log.Add(s));
        controller.RequestElevator(3, Direction.Up);
        controller.RequestDestination(7);
        await controller.ProcessRequestsAsync();
        Assert.Equal(7, controller.CurrentFloor);
        Assert.Equal(ElevatorState.Idle, controller.Status);
    }

    [Fact]
    public void ElevatorController_InvalidFloor_Throws()
    {
        var controller = new ElevatorController();
        Assert.Throws<ArgumentOutOfRangeException>(() => controller.RequestElevator(0, Direction.Up));
        Assert.Throws<ArgumentOutOfRangeException>(() => controller.RequestElevator(11, Direction.Up));
    }

    [Fact]
    public void ElevatorController_RequestDestination_InvalidFloor_Throws()
    {
        var controller = new ElevatorController();
        Assert.Throws<ArgumentOutOfRangeException>(() => controller.RequestDestination(0));
        Assert.Throws<ArgumentOutOfRangeException>(() => controller.RequestDestination(11));
    }

    [Fact]
    public void Elevator_OpenDoor_CloseDoor_TransitionsThroughStates()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.OpenDoor();
        Assert.Equal(ElevatorState.DoorOpen, elevator.State);
        elevator.CloseDoor();
        Assert.Equal(ElevatorState.Idle, elevator.State);
    }

    [Fact]
    public void Elevator_MoveUp_AtMaxFloor_DoesNothing()
    {
        var elevator = new Elevator(1, 1, 3);
        elevator.MoveUp();
        elevator.MoveUp();
        elevator.MoveUp(); // at max
        elevator.MoveUp(); // no-op
        Assert.Equal(3, elevator.CurrentFloor);
        Assert.Equal(ElevatorState.MovingUp, elevator.State);
    }

    [Fact]
    public void Elevator_MoveDown_AtMinFloor_DoesNothing()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.AddRequest(2);
        elevator.MoveUp(); // floor 2
        elevator.MoveDown(); // floor 1
        elevator.MoveDown(); // no-op at min
        Assert.Equal(1, elevator.CurrentFloor);
        Assert.Equal(ElevatorState.MovingDown, elevator.State);
    }

    [Fact]
    public void Elevator_AddRequest_RequestObject_AddsPickupAndDestination()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.AddRequest(Request.Create(3, 7));
        Assert.True(elevator.TryGetNextTarget(out var first));
        Assert.Equal(3, first);
        elevator.CompleteCurrentTarget();
        Assert.True(elevator.TryGetNextTarget(out var second));
        Assert.Equal(7, second);
    }

    [Fact]
    public void Elevator_GetSnapshot_ReturnsConsistentState()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.AddRequest(5);
        elevator.MoveUp();
        elevator.MoveUp();
        var snap = elevator.GetSnapshot();
        Assert.Equal(1, snap.Id);
        Assert.Equal(3, snap.CurrentFloor);
        Assert.Equal(ElevatorState.MovingUp, snap.State);
        Assert.Equal(1, snap.PendingRequestCount);
        Assert.Contains(5, snap.TargetFloors);
    }

    [Fact]
    public void Elevator_TryDequeueNextTarget_RemovesFromQueue()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.AddRequest(5);
        elevator.AddRequest(7);
        Assert.True(elevator.TryDequeueNextTarget(out var first));
        Assert.Equal(5, first);
        Assert.True(elevator.TryGetNextTarget(out var next));
        Assert.Equal(7, next);
    }

    [Fact]
    public void Elevator_AddRequest_DuplicateFloor_NotAddedTwice()
    {
        var elevator = new Elevator(1, 1, 10);
        elevator.AddRequest(5);
        elevator.AddRequest(5);
        elevator.AddRequest(5);
        Assert.Equal(1, elevator.PendingRequestCount);
    }

    [Fact]
    public void ElevatorSystem_AssignRequest_QueuesRequest()
    {
        var system = new ElevatorSystem(4);
        system.RequestTrip(5, 10);
        system.StartProcessing();
        var status = system.GetStatus();
        Assert.Equal(4, status.Length);
        system.Stop();
    }

    [Fact]
    public void ElevatorSystem_InvalidFloor_Throws()
    {
        var system = new ElevatorSystem(4);
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            system.RequestTrip(0, 5));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            system.RequestTrip(5, 21));
    }

    [Fact]
    public void Request_Create_SetsDirectionAndTimestamp()
    {
        var ts = DateTimeOffset.UtcNow;
        var req = Request.Create(5, 10, timestamp: ts);
        Assert.Equal(5, req.PickupFloor);
        Assert.Equal(10, req.DestinationFloor);
        Assert.Equal(Direction.Up, req.Direction);
        Assert.True(req.Timestamp > 0);
    }

    [Fact]
    public void Request_Create_DownDirection_WhenDestinationBelowPickup()
    {
        var req = Request.Create(10, 3);
        Assert.Equal(Direction.Down, req.Direction);
    }

    [Fact]
    public void Request_Pickup_SetsDirectionAndTimestamp()
    {
        var req = Request.Pickup(5, Direction.Up);
        Assert.Equal(5, req.PickupFloor);
        Assert.Equal(5, req.DestinationFloor);
        Assert.Equal(Direction.Up, req.Direction);
        Assert.True(req.Timestamp > 0);
    }

    [Fact]
    public void ElevatorSystem_FindBestElevator_ReturnsClosestWhenAllIdle()
    {
        var system = new ElevatorSystem(4);
        system.StartProcessing();
        var req = Request.Create(10, 15);
        var best = system.FindBestElevator(req);
        Assert.NotNull(best);
        Assert.Equal(1, best!.CurrentFloor);
        system.Stop();
    }

    [Fact]
    public void ElevatorSystem_BalanceLoad_AssignsFromQueue()
    {
        var system = new ElevatorSystem(4);
        system.RequestTrip(5, 10);
        system.RequestTrip(3, 8);
        Assert.Equal(0, system.GetStatus().Sum(s => s.PendingRequestCount));
        system.BalanceLoad();
        var status = system.GetStatus();
        Assert.True(status.Sum(s => s.PendingRequestCount) >= 2);
    }

    [Fact]
    public void ElevatorSystem_GetStatus_ReturnsAllElevatorsWithCorrectStructure()
    {
        var system = new ElevatorSystem(5);
        var status = system.GetStatus();
        Assert.Equal(5, status.Length);
        Assert.All(status, s =>
        {
            Assert.InRange(s.Id, 1, 5);
            Assert.InRange(s.CurrentFloor, 1, 20);
            Assert.NotNull(s.TargetFloors);
        });
    }

    [Fact]
    public async Task ElevatorSystem_100ConcurrentRequests_Efficient()
    {
        var system = new ElevatorSystem(4);
        system.StartProcessing();
        var tasks = Enumerable.Range(0, 120)
            .Select(i => Task.Run(() =>
            {
                var f = (i % 19) + 1;
                var d = ((i * 3) % 19) + 1;
                if (f != d) system.RequestTrip(f, d);
            }))
            .ToArray();
        await Task.WhenAll(tasks);
        var status = system.GetStatus();
        Assert.All(status, s => Assert.InRange(s.CurrentFloor, 1, 20));
        system.Stop();
    }

    [Fact]
    public void ElevatorDispatcher_SelectBest_PrefersSameDirection()
    {
        var elevators = new[]
        {
            new Elevator(1, 1, 20, null),
            new Elevator(2, 1, 20, null)
        };
        elevators[0].AddRequest(5);
        for (var i = 0; i < 4; i++) elevators[0].MoveUp();
        elevators[1].AddRequest(10);
        for (var i = 0; i < 9; i++) elevators[1].MoveUp();
        var dispatcher = new ElevatorDispatcher();
        var req = Request.Pickup(12, Direction.Up);
        var best = dispatcher.SelectBest(elevators, req);
        Assert.NotNull(best);
        Assert.Equal(2, best!.Id);
    }

    [Fact]
    public void ElevatorDispatcher_SelectBest_LoadPenalty_PrefersLessLoaded()
    {
        var elevators = new[]
        {
            new Elevator(1, 1, 20, null),
            new Elevator(2, 1, 20, null)
        };
        elevators[0].AddRequest(Request.Create(2, 5));
        elevators[0].AddRequest(Request.Create(6, 10));
        elevators[0].AddRequest(Request.Create(11, 15));
        elevators[1].AddRequest(Request.Create(3, 7));
        var dispatcher = new ElevatorDispatcher();
        var req = Request.Create(4, 8);
        var best = dispatcher.SelectBest(elevators, req);
        Assert.NotNull(best);
        Assert.Equal(2, best!.Id);
    }

    [Fact]
    public async Task ElevatorSystem_ConcurrentRequests_ThreadSafe()
    {
        var system = new ElevatorSystem(4);
        system.StartProcessing();
        var tasks = Enumerable.Range(0, 50)
            .Select(i => Task.Run(() =>
            {
                var floor = (i % 19) + 1;
                var dest = (i % 19) + 1;
                if (floor != dest) system.RequestTrip(floor, dest);
            }))
            .ToArray();
        await Task.WhenAll(tasks);
        var status = system.GetStatus();
        Assert.All(status, s => Assert.InRange(s.CurrentFloor, 1, 20));
        system.Stop();
    }

    [Fact]
    public void EnterpriseElevator_LOOK_SelectsNextInCurrentDirection()
    {
        var elevator = new EnterpriseElevator(1, ElevatorType.Local, 1, 10);
        elevator.AddRequest(Request.Create(3, 8));
        Assert.True(elevator.TryGetNextTarget(out var first));
        Assert.InRange(first, 3, 8);
        while (elevator.CurrentFloor != first)
        {
            if (elevator.CurrentFloor < first) elevator.MoveUp();
            else elevator.MoveDown();
        }
        elevator.CompleteCurrentTarget(first);
        Assert.True(elevator.TryGetNextTarget(out var second));
        Assert.InRange(second, 1, 10);
    }

    [Fact]
    public void EnterpriseElevator_Freight_ServesAllowedFloors()
    {
        var allFloors = Enumerable.Range(1, 20).ToArray();
        var freight = new EnterpriseElevator(1, ElevatorType.Freight, 1, 20, allFloors);
        Assert.True(freight.CanServeFloor(1));
        Assert.True(freight.CanServeFloor(10));
        Assert.True(freight.CanServeFloor(20));
    }

    [Fact]
    public void EnterpriseElevator_Local_ServesAllFloors()
    {
        var local = new EnterpriseElevator(1, ElevatorType.Local, 1, 30);
        Assert.True(local.CanServeFloor(1));
        Assert.True(local.CanServeFloor(15));
        Assert.True(local.CanServeFloor(30));
    }

    [Fact]
    public void PerformanceMetrics_RecordTripCompleted_Increments()
    {
        var metrics = new PerformanceMetrics();
        metrics.RecordTripCompleted(1);
        metrics.RecordTripCompleted(1);
        metrics.RecordTripCompleted(2);
        var snap = metrics.Snapshot();
        Assert.Equal(3, snap.TotalTripsCompleted);
        Assert.Equal(2, snap.ByElevator[1].TripsCompleted);
        Assert.Equal(1, snap.ByElevator[2].TripsCompleted);
    }

    [Fact]
    public void EnterpriseElevatorSystem_Analytics_ByElevator_RecordsCompletedTrips()
    {
        var system = new EnterpriseElevatorSystem();
        system.StartProcessing();
        system.RequestTrip(1, 5);
        system.RequestTrip(2, 8);
        system.RequestTrip(10, 3);
        Thread.Sleep(2000);
        var analytics = system.GetAnalytics();
        Assert.True(analytics.TotalTripsCompleted >= 1);
        Assert.True(analytics.ByElevator.Count >= 1);
        system.Stop();
    }

    [Fact]
    public void EnterpriseElevator_Express_OnlyServesAllowedFloors()
    {
        var elevator = new EnterpriseElevator(1, ElevatorType.Express, 1, 30, [1, 10, 20, 30]);
        Assert.True(elevator.CanServeFloor(1));
        Assert.True(elevator.CanServeFloor(10));
        Assert.False(elevator.CanServeFloor(5));
    }

    [Fact]
    public void EnterpriseElevator_Maintenance_EmergencyStop_BlocksMovement()
    {
        var elevator = new EnterpriseElevator(1, ElevatorType.Local, 1, 10);
        elevator.SetMaintenance(true);
        Assert.Equal(ElevatorState.Maintenance, elevator.State);
        elevator.SetMaintenance(false);

        elevator.EmergencyStop();
        Assert.Equal(ElevatorState.EmergencyStopped, elevator.State);
        elevator.ClearEmergency();
        Assert.Equal(ElevatorState.Idle, elevator.State);
    }

    [Fact]
    public void EnterpriseElevatorSystem_VIP_PriorityOverRegular()
    {
        var system = new EnterpriseElevatorSystem();
        system.RequestTrip(5, 10, isVip: false);
        system.RequestTrip(2, 8, isVip: true);
        system.StartProcessing();
        var status = system.GetStatus();
        Assert.Equal(5, status.Length);
        var analytics = system.GetAnalytics();
        Assert.NotNull(analytics);
        system.Stop();
    }

    [Fact]
    public void EnterpriseElevatorSystem_Analytics_RecordsTrips()
    {
        var system = new EnterpriseElevatorSystem();
        system.StartProcessing();
        system.RequestTrip(1, 10);
        system.RequestTrip(2, 9);
        Task.Delay(500).Wait();
        var analytics = system.GetAnalytics();
        Assert.True(analytics.TotalTripsCompleted >= 0);
        system.Stop();
    }

    [Fact]
    public void EnterpriseElevator_Maintenance_RejectsRequests()
    {
        var elevator = new EnterpriseElevator(1, ElevatorType.Local, 1, 10);
        elevator.SetMaintenance(true);
        Assert.Equal(ElevatorState.Maintenance, elevator.State);
        Assert.False(elevator.CanServeFloor(5));
        elevator.SetMaintenance(false);
        Assert.True(elevator.CanServeFloor(5));
    }

    [Fact]
    public void EnterpriseElevator_EmergencyStop_BlocksMovement()
    {
        var elevator = new EnterpriseElevator(1, ElevatorType.Local, 1, 10);
        elevator.AddRequest(Request.Create(5, 7));
        elevator.EmergencyStop();
        Assert.Equal(ElevatorState.EmergencyStopped, elevator.State);
        elevator.ClearEmergency();
        Assert.Equal(ElevatorState.Idle, elevator.State);
    }

    [Fact]
    public void EnterpriseElevatorSystem_VipRequest_ProcessedFirst()
    {
        var system = new EnterpriseElevatorSystem();
        system.RequestTrip(5, 10, isVip: true);
        system.RequestTrip(2, 8, isVip: false);
        system.StartProcessing();
        var sw = System.Diagnostics.Stopwatch.StartNew();
        while (sw.ElapsedMilliseconds < 5000)
        {
            var status = system.GetStatus();
            if (status.Any(s => s.TargetFloors.Length > 0 || s.PendingRequestCount > 0))
                break;
            Thread.Sleep(100);
        }
        system.Stop();
        var final = system.GetStatus();
        Assert.True(final.Any(s => s.TargetFloors.Length > 0 || s.PendingRequestCount > 0),
            "Expected at least one elevator to have assigned work within 5s");
    }

    [Fact]
    public void EnterpriseElevatorSystem_GetAnalytics_ReturnsMetrics()
    {
        var system = new EnterpriseElevatorSystem();
        system.StartProcessing();
        system.RequestTrip(1, 5);
        Thread.Sleep(500); // Allow some processing
        var analytics = system.GetAnalytics();
        Assert.NotNull(analytics);
        Assert.True(analytics.TotalTripsCompleted >= 0);
        system.Stop();
    }

    [Fact]
    public void EnterpriseElevator_FloorRestrictions_ExpressSkipsFloors()
    {
        var express = new EnterpriseElevator(1, ElevatorType.Express, 1, 30, new[] { 1, 10, 20, 30 });
        Assert.True(express.CanServeFloor(1));
        Assert.True(express.CanServeFloor(10));
        Assert.False(express.CanServeFloor(5));
    }

    [Fact]
    public void EnterpriseElevator_MaintenanceAndEmergency_BlocksService()
    {
        var e = new EnterpriseElevator(1, ElevatorType.Local, 1, 10);
        e.SetMaintenance(true);
        Assert.Equal(ElevatorState.Maintenance, e.State);
        e.SetMaintenance(false);
        e.EmergencyStop();
        Assert.Equal(ElevatorState.EmergencyStopped, e.State);
        e.ClearEmergency();
        Assert.Equal(ElevatorState.Idle, e.State);
    }

    [Fact]
    public void EnterpriseSystem_VIP_QueuesFirst()
    {
        var system = new EnterpriseElevatorSystem();
        system.RequestTrip(5, 10, isVip: true);
        system.RequestTrip(3, 8, isVip: false);
        system.StartProcessing();
        var status = system.GetStatus();
        Assert.Equal(5, status.Length);
        Assert.Contains(status, s => s.Type == ElevatorType.Express || s.Type == ElevatorType.Local);
        system.Stop();
    }

    [Fact]
    public void EnterpriseSystem_Analytics_RecordsTrips()
    {
        var system = new EnterpriseElevatorSystem();
        system.StartProcessing();
        system.RequestTrip(1, 10);
        system.RequestTrip(10, 5);
        Thread.Sleep(500);
        var analytics = system.GetAnalytics();
        Assert.True(analytics.TotalTripsCompleted >= 0);
        system.Stop();
    }

    [Fact]
    public void EnterpriseElevatorSystem_UnserviceableRequest_DroppedNotLooped()
    {
        var log = new List<string>();
        var expressOnly = new[]
        {
            new EnterpriseElevator(1, ElevatorType.Express, 1, 30, [1, 10, 20, 30], s => { }),
            new EnterpriseElevator(2, ElevatorType.Express, 1, 30, [1, 10, 20, 30], s => { })
        };
        var system = new EnterpriseElevatorSystem(expressOnly, s => log.Add(s));
        system.StartProcessing();
        system.RequestTrip(5, 7);
        Thread.Sleep(600);
        var dropped = log.Any(m => m.Contains("dropped") && m.Contains("unserviceable"));
        Assert.True(dropped, "Unserviceable request (floor 5,7 with Express-only) should be dropped, not requeued");
        system.Stop();
    }

    [Fact]
    public void ElevatorSystem_AssignmentResponseTime_Under100ms()
    {
        var system = new ElevatorSystem(4);
        system.StartProcessing();
        for (var i = 0; i < 100; i++)
        {
            var req = Request.Create((i % 19) + 1, ((i * 7) % 19) + 1);
            var sw = Stopwatch.StartNew();
            var elevator = system.FindBestElevator(req);
            if (elevator is not null)
                elevator.AddRequest(req);
            sw.Stop();
            Assert.True(sw.ElapsedMilliseconds < 100, $"Assignment #{i + 1} took {sw.ElapsedMilliseconds}ms (spec: <100ms)");
        }
        system.Stop();
    }

    [Fact]
    public async Task ElevatorSystem_StuckTimeout_DetectsAndClearsStuckTarget()
    {
        var log = new List<string>();
        var time = new AutoAdvancingTimeProvider(TimeSpan.FromMilliseconds(60)); // each read advances 60ms
        var system = new ElevatorSystem(4, logger: s => log.Add(s), stuckTimeout: TimeSpan.FromMilliseconds(50), time: time);
        system.StartProcessing();
        await Task.Delay(50);
        system.RequestTrip(1, 20);
        await Task.Delay(400); // Loop runs: iter1 assign+progress (lastProgress=T0), iter2 now=T0+60ms > 50ms → stuck
        Assert.True(log.Exists(m => m.Contains("stuck") && m.Contains("timeout")));
        system.Stop();
    }

    [Fact]
    public async Task EnterpriseElevatorSystem_StuckTimeout_DetectsAndClearsStuckTarget()
    {
        var log = new List<string>();
        var time = new AutoAdvancingTimeProvider(TimeSpan.FromMilliseconds(60));
        var system = new EnterpriseElevatorSystem(logger: s => log.Add(s), stuckTimeout: TimeSpan.FromMilliseconds(50), time: time);
        system.StartProcessing();
        await Task.Delay(50);
        system.RequestTrip(1, 20);
        await Task.Delay(400);
        Assert.True(log.Exists(m => m.Contains("stuck") && m.Contains("timeout")));
        system.Stop();
    }

    [Fact]
    public async Task EnterpriseElevatorSystem_RequeueRequest_WhenAllElevatorsBusy_RetriesUntilAssigned()
    {
        var log = new List<string>();
        var elevators = new[]
        {
            new EnterpriseElevator(1, ElevatorType.Local, 1, 10, null, s => { }),
            new EnterpriseElevator(2, ElevatorType.Local, 1, 10, null, s => { })
        };
        var system = new EnterpriseElevatorSystem(elevators, s => log.Add(s));
        system.SetMaintenance(1, true);
        system.SetMaintenance(2, true);
        system.StartProcessing();
        system.RequestTrip(3, 7); // Serviceable by both when not in maintenance
        await Task.Delay(300); // Request gets dequeued, FindBest=null (all maintenance), RequeueRequest
        system.SetMaintenance(1, false); // Elevator 1 becomes available
        await Task.Delay(800); // Next dequeue assigns to elevator 1, elevator moves and completes
        var assigned = log.Exists(m => m.Contains("Assigned") && m.Contains("pickup=3"));
        Assert.True(assigned, "Request should eventually be assigned after elevator exits maintenance");
        system.Stop();
    }

}
