using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Api.Tests.Integration;

public sealed class ElevatorIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ElevatorIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GET_elevator_single_status_Returns200_WithFloorAndState()
    {
        var response = await _client.GetAsync("/elevator/single/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<SingleStatusResponse>();
        Assert.NotNull(json);
        Assert.InRange(json!.Floor, 1, 10);
        Assert.NotNull(json.State);
    }

    [Fact]
    public async Task POST_elevator_single_request_Accepts_AndStatusReflects()
    {
        await _client.PostAsJsonAsync("/elevator/single/request", new { Floor = 5, Direction = "Up" });
        var statusBefore = await _client.GetFromJsonAsync<SingleStatusResponse>("/elevator/single/status");
        Assert.NotNull(statusBefore);

        await _client.PostAsync("/elevator/single/process", null);

        var statusAfter = await _client.GetFromJsonAsync<SingleStatusResponse>("/elevator/single/status");
        Assert.NotNull(statusAfter);
        Assert.Equal(5, statusAfter!.Floor);
    }

    [Fact]
    public async Task GET_elevator_system_status_Returns200_WithElevatorsArray()
    {
        var response = await _client.GetAsync("/elevator/system/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var elevators = await response.Content.ReadFromJsonAsync<SystemElevatorStatus[]>();
        Assert.NotNull(elevators);
        Assert.Equal(4, elevators!.Length);
        foreach (var e in elevators)
        {
            Assert.InRange(e.Id, 1, 4);
            Assert.InRange(e.CurrentFloor, 1, 20);
            Assert.NotNull(e.State);
        }
    }

    [Fact]
    public async Task POST_elevator_system_trip_Accepts_AndStatusReturnsValid()
    {
        var response = await _client.PostAsJsonAsync("/elevator/system/trip", new { PickupFloor = 1, DestinationFloor = 20 });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);

        var elevators = await _client.GetFromJsonAsync<SystemElevatorStatus[]>("/elevator/system/status");
        Assert.NotNull(elevators);
        Assert.Equal(4, elevators!.Length);
    }

    [Fact]
    public async Task GET_elevator_enterprise_status_Returns200_WithEnterpriseStructure()
    {
        var response = await _client.GetAsync("/elevator/enterprise/status");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var elevators = await response.Content.ReadFromJsonAsync<EnterpriseElevatorStatus[]>();
        Assert.NotNull(elevators);
        Assert.True(elevators!.Length >= 5);
        foreach (var e in elevators)
        {
            Assert.InRange(e.Id, 1, 10);
            Assert.InRange(e.CurrentFloor, 1, 30);
            Assert.NotNull(e.State);
            Assert.NotNull(e.Type);
        }
    }

    [Fact]
    public async Task GET_elevator_enterprise_analytics_Returns200_WithAnalyticsStructure()
    {
        var response = await _client.GetAsync("/elevator/enterprise/analytics");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadFromJsonAsync<EnterpriseAnalyticsResponse>();
        Assert.NotNull(json);
        Assert.True(json!.TotalTripsCompleted >= 0);
        Assert.True(json.AverageWaitTimeMs >= 0);
    }

    private sealed record SingleStatusResponse(int Floor, string State);
    private sealed record SystemElevatorStatus(int Id, int CurrentFloor, string State, int PendingRequestCount, int[]? TargetFloors);
    private sealed record EnterpriseElevatorStatus(int Id, int CurrentFloor, string State, string Type);
    private sealed record EnterpriseAnalyticsResponse(long TotalTripsCompleted, double AverageWaitTimeMs);
}
