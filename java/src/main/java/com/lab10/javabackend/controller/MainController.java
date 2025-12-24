package com.lab10.javabackend.controller;

import com.lab10.javabackend.model.User;
import com.lab10.javabackend.service.UserService;
import com.lab10.javabackend.service.HealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/")
public class MainController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private HealthService healthService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(healthService.getHealthStatus());
    }

    @GetMapping("/api/users")
    public ResponseEntity<List<User>> getUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/api/users")
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        User savedUser = userService.saveUser(user);
        return ResponseEntity.ok(savedUser);
    }

    @GetMapping("/api/postgres/test")
    public ResponseEntity<Map<String, String>> testPostgres() {
        try {
            long userCount = userService.getUserCount();
            return ResponseEntity.ok(Map.of(
                "message", "PostgreSQL connection successful",
                "userCount", String.valueOf(userCount),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "PostgreSQL connection failed",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/api/redis/test")
    public ResponseEntity<Map<String, String>> testRedis() {
        try {
            String result = healthService.testRedisConnection();
            return ResponseEntity.ok(Map.of(
                "message", "Redis connection successful",
                "testValue", result,
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Redis connection failed",
                "message", e.getMessage()
            ));
        }
    }
}