using System.Text.Json.Serialization;
using Api.Elevators.Easy;
using Api.Elevators.Medium;
using Api.Elevators.Hard;
using Api.Elevators.Shared;

var builder = WebApplication.CreateBuilder(args);
builder.Services.ConfigureHttpJsonOptions(opts =>
    opts.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Elevator System API", Version = "v1" });
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173").AllowAnyMethod().AllowAnyHeader();
    });
});
var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

// --- Easy: Single elevator (floors 1–10, FIFO) ---
var singleController = new ElevatorController(s => Console.WriteLine(s));

app.MapGet("/health", () => Results.Ok(new { status = "ok", timestamp = DateTimeOffset.UtcNow }));

app.MapGet("/elevator/single/status", () =>
{
    return Results.Ok(new
    {
        floor = singleController.CurrentFloor,
        state = singleController.Status.ToString()
    });
});

app.MapPost("/elevator/single/request", (RequestElevatorPayload p) =>
{
    singleController.RequestElevator(p.Floor, p.Direction);
    return Results.Accepted();
});

app.MapPost("/elevator/single/destination", (RequestElevatorPayload p) =>
{
    singleController.RequestDestination(p.Floor);
    return Results.Accepted();
});

app.MapPost("/elevator/single/process", async (CancellationToken ct) =>
{
    await singleController.ProcessRequestsAsync(ct);
    return Results.Ok();
});

// --- Medium: Multi-elevator (floors 1–20, thread-safe dispatch) ---
var multiSystem = new ElevatorSystem(4, s => Console.WriteLine(s));
multiSystem.StartProcessing();

app.MapGet("/elevator/system/status", () => multiSystem.GetStatus());

app.MapPost("/elevator/system/trip", (RequestTripPayload p) =>
{
    multiSystem.RequestTrip(p.PickupFloor, p.DestinationFloor);
    return Results.Accepted();
});

app.MapPost("/elevator/system/request", (RequestElevatorPayload p) =>
{
    multiSystem.RequestElevator(p.Floor, p.Direction);
    return Results.Accepted();
});

// --- Hard: Enterprise (elevator types, LOOK, VIP, maintenance, analytics) ---
var enterpriseSystem = new EnterpriseElevatorSystem(s => Console.WriteLine(s));
enterpriseSystem.StartProcessing();

app.MapGet("/elevator/enterprise/status", () => enterpriseSystem.GetStatus());
app.MapGet("/elevator/enterprise/analytics", () => enterpriseSystem.GetAnalytics());
app.MapPost("/elevator/enterprise/trip", (EnterpriseTripPayload p) =>
{
    enterpriseSystem.RequestTrip(p.PickupFloor, p.DestinationFloor, p.IsVip);
    return Results.Accepted();
});
app.MapPost("/elevator/enterprise/request", (EnterpriseRequestPayload p) =>
{
    enterpriseSystem.RequestElevator(p.Floor, p.Direction, p.IsVip);
    return Results.Accepted();
});
app.MapPost("/elevator/enterprise/maintenance/{id:int}", (int id, MaintenancePayload p) =>
{
    enterpriseSystem.SetMaintenance(id, p.Enabled);
    return Results.Ok();
});
app.MapPost("/elevator/enterprise/emergency-stop/{id:int}", (int id) =>
{
    enterpriseSystem.EmergencyStop(id);
    return Results.Ok();
});
app.MapPost("/elevator/enterprise/clear-emergency/{id:int}", (int id) =>
{
    enterpriseSystem.ClearEmergency(id);
    return Results.Ok();
});

app.Run();

public partial class Program;

record RequestElevatorPayload(int Floor, Direction Direction);
record RequestTripPayload(int PickupFloor, int DestinationFloor);
record EnterpriseTripPayload(int PickupFloor, int DestinationFloor, bool IsVip = false);
record EnterpriseRequestPayload(int Floor, Direction Direction, bool IsVip = false);
record MaintenancePayload(bool Enabled);
