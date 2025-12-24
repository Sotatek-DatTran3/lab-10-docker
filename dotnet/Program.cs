using Microsoft.EntityFrameworkCore;
using DotnetBackend.Data;
using DotnetBackend.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Configure to listen on all interfaces
builder.WebHost.UseUrls("http://0.0.0.0:80");

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Add Entity Framework
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add Redis with detailed error handling and optional registration
var redisHost = Environment.GetEnvironmentVariable("REDIS_HOST") ?? "localhost";
var redisPort = Environment.GetEnvironmentVariable("REDIS_PORT") ?? "6379";
var redisConnectionString = $"{redisHost}:{redisPort}";

Console.WriteLine($"Attempting to connect to Redis at: {redisConnectionString}");

try
{
    var configurationOptions = new ConfigurationOptions
    {
        EndPoints = { redisConnectionString },
        AbortOnConnectFail = false,
        ConnectTimeout = 10000,  // Increased timeout
        ConnectRetry = 5,        // More retries
        ReconnectRetryPolicy = new LinearRetry(2000), // 2 second delays
        KeepAlive = 30,          // Keep connection alive
        AllowAdmin = false,      // Security
        SyncTimeout = 5000       // Sync operation timeout
    };
    
    Console.WriteLine("Creating Redis connection with resilient configuration...");
    var multiplexer = ConnectionMultiplexer.Connect(configurationOptions);
    
    // Test the connection
    Console.WriteLine("Testing Redis connection...");
    var database = multiplexer.GetDatabase();
    database.StringSet("test-connection", "success");
    var testResult = database.StringGet("test-connection");
    Console.WriteLine($"✅ Redis connection test result: {testResult}");
    
    // Register successful connection
    builder.Services.AddSingleton<IConnectionMultiplexer>(multiplexer);
    builder.Services.AddScoped<IRedisService, RedisService>();
    
    Console.WriteLine("✅ Redis services registered successfully");
}
catch (Exception ex)
{
    Console.WriteLine($"❌ Redis connection failed: {ex.Message}");
    Console.WriteLine($"Stack trace: {ex.StackTrace}");
    Console.WriteLine("Continuing without Redis - using NoOpRedisService");
    
    // Register no-op Redis service
    builder.Services.AddScoped<IRedisService, NoOpRedisService>();
}

// Add Health Checks
builder.Services.AddHealthChecks()
    .AddNpgSql(builder.Configuration.GetConnectionString("DefaultConnection"));

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
}

app.Run();