package com.lab10.javabackend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class HealthService {

    @Autowired
    private DataSource dataSource;

    @Autowired(required = false)
    private RedisTemplate<String, String> redisTemplate;

    public Map<String, Object> getHealthStatus() {
        Map<String, Object> health = new HashMap<>();
        health.put("service", "Java Spring Boot Backend");
        health.put("version", "1.0.0");
        health.put("timestamp", LocalDateTime.now().toString());

        // Database health check
        Map<String, String> database = new HashMap<>();
        try {
            Connection connection = dataSource.getConnection();
            String version = connection.getMetaData().getDatabaseProductVersion();
            database.put("postgresql", "Connected");
            database.put("version", version);
            connection.close();
        } catch (Exception e) {
            database.put("postgresql", "Disconnected");
            database.put("error", e.getMessage());
        }

        // Redis health check
        if (redisTemplate != null) {
            try {
                redisTemplate.opsForValue().set("health-check", "ok");
                database.put("redis", "Connected");
            } catch (Exception e) {
                database.put("redis", "Disconnected");
            }
        } else {
            database.put("redis", "Not configured");
        }

        health.put("database", database);
        health.put("uptime", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime() / 1000);

        return health;
    }

    public String testRedisConnection() {
        if (redisTemplate == null) {
            throw new RuntimeException("Redis not configured");
        }
        
        String testKey = "java-test-key";
        String testValue = "Hello from Java Spring Boot!";
        
        redisTemplate.opsForValue().set(testKey, testValue);
        return redisTemplate.opsForValue().get(testKey);
    }
}