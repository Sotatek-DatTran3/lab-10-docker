using StackExchange.Redis;

namespace DotnetBackend.Services;

public interface IRedisService
{
    Task<string?> GetAsync(string key);
    Task SetAsync(string key, string value, TimeSpan? expiry = null);
    Task<bool> KeyExistsAsync(string key);
}

public class RedisService : IRedisService
{
    private readonly IDatabase _database;

    public RedisService(IConnectionMultiplexer redis)
    {
        _database = redis.GetDatabase();
    }

    public async Task<string?> GetAsync(string key)
    {
        return await _database.StringGetAsync(key);
    }

    public async Task SetAsync(string key, string value, TimeSpan? expiry = null)
    {
        await _database.StringSetAsync(key, value, expiry);
    }

    public async Task<bool> KeyExistsAsync(string key)
    {
        return await _database.KeyExistsAsync(key);
    }
}

public class NoOpRedisService : IRedisService
{
    public Task<string?> GetAsync(string key)
    {
        return Task.FromResult<string?>(null);
    }

    public Task SetAsync(string key, string value, TimeSpan? expiry = null)
    {
        return Task.CompletedTask;
    }

    public Task<bool> KeyExistsAsync(string key)
    {
        return Task.FromResult(false);
    }
}