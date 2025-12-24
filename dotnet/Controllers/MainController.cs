using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DotnetBackend.Data;
using DotnetBackend.Models;
using DotnetBackend.Services;
using Npgsql;

namespace DotnetBackend.Controllers;

[ApiController]
[Route("/")]
public class MainController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IRedisService? _redisService;
    private readonly IConfiguration _configuration;

    public MainController(ApplicationDbContext context, IConfiguration configuration, IRedisService? redisService = null)
    {
        _context = context;
        _redisService = redisService;
        _configuration = configuration;
    }

    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var health = new
        {
            service = "ASP.NET Core Backend",
            version = "1.0.0",
            timestamp = DateTime.UtcNow.ToString("O"),
            database = await GetDatabaseStatus()
        };

        return Ok(health);
    }

    [HttpGet("api/users")]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        try
        {
            var users = await _context.Users
                .OrderByDescending(u => u.CreatedAt)
                .Take(10)
                .ToListAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("api/users")]
    public async Task<ActionResult<User>> CreateUser(User user)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("api/postgres/test")]
    public async Task<IActionResult> TestPostgres()
    {
        try
        {
            var userCount = await _context.Users.CountAsync();
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            
            using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();
            using var command = new NpgsqlCommand("SELECT version()", connection);
            var version = await command.ExecuteScalarAsync();

            return Ok(new
            {
                message = "PostgreSQL connection successful",
                userCount = userCount,
                version = version?.ToString(),
                timestamp = DateTime.UtcNow.ToString("O")
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = "PostgreSQL connection failed",
                message = ex.Message
            });
        }
    }

    [HttpGet("api/redis/test")]
    public async Task<IActionResult> TestRedis()
    {
        try
        {
            if (_redisService == null)
            {
                return StatusCode(503, new { error = "Redis not configured" });
            }

            const string testKey = "dotnet-test-key";
            const string testValue = "Hello from ASP.NET Core!";

            await _redisService.SetAsync(testKey, testValue, TimeSpan.FromMinutes(5));
            var retrievedValue = await _redisService.GetAsync(testKey);

            return Ok(new
            {
                message = "Redis connection successful",
                testValue = retrievedValue,
                timestamp = DateTime.UtcNow.ToString("O")
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = "Redis connection failed",
                message = ex.Message
            });
        }
    }

    private async Task<object> GetDatabaseStatus()
    {
        try
        {
            // Test PostgreSQL connection
            await _context.Database.OpenConnectionAsync();
            var version = _context.Database.GetConnectionString();
            
            var postgresStatus = new
            {
                postgres = "Connected",
                connection = !string.IsNullOrEmpty(version) ? "Available" : "Unknown"
            };

            // Test Redis connection
            string redisStatus;
            try
            {
                if (_redisService != null)
                {
                    await _redisService.SetAsync("health-check", "ok", TimeSpan.FromSeconds(30));
                    redisStatus = "Connected";
                }
                else
                {
                    redisStatus = "Not configured";
                }
            }
            catch
            {
                redisStatus = "Disconnected";
            }

            return new
            {
                postgres = postgresStatus.postgres,
                redis = redisStatus
            };
        }
        catch (Exception ex)
        {
            return new
            {
                postgres = "Disconnected",
                redis = _redisService != null ? "Unknown" : "Not configured",
                error = ex.Message
            };
        }
        finally
        {
            if (_context.Database.GetDbConnection().State == System.Data.ConnectionState.Open)
            {
                await _context.Database.CloseConnectionAsync();
            }
        }
    }
}