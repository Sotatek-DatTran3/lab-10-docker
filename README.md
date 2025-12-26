# Lab10 Docker - Complete 3-Tier Architecture Documentation

## 🎯 Overview

This project demonstrates a complete **3-tier architecture** with **7 different backend technologies** and a React frontend, all containerized and orchestrated with Docker. The architecture has been optimized to eliminate heavy SQL Server dependencies and provides both Docker Compose and Docker Swarm deployment options.

## 🏗️ Architecture

### **Tier 1: Frontend**
- **React** (Port 3000) - Modern web application with Nginx

### **Tier 2: Backend Services**
- **Node.js Express** (Port 8000) - MongoDB + PostgreSQL + Redis
- **Python Django** (Port 8003) - PostgreSQL + Redis  
- **Java Spring Boot** (Port 8002) - PostgreSQL + Redis
- **PHP** (Port 8001/8080) - MySQL + Redis
- **.NET Core** (Port 8004) - PostgreSQL + Redis
- **NestJS TypeScript** (Port 8005) - PostgreSQL + Redis

### **Tier 3: Database Layer**
- **PostgreSQL** (Port 5432) - Primary database for Java, Python, .NET, NestJS
- **MySQL** (Port 3306) - Used by PHP backend
- **MongoDB** (Port 27017) - Used by Node.js backend  
- **Redis** (Port 6379) - Caching layer for all backends

## 📁 Project Structure

```
lab10-docker/
├── docker-compose.yml          # Development orchestration
├── docker-stack.yml           # Production Swarm deployment
├── shared/
│   ├── nginx/                 # Nginx configurations
│   └── db/                    # Database init scripts
├── react/                     # React frontend
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── nodejs/                    # Node.js backend
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── php/                       # PHP backend
│   ├── Dockerfile
│   ├── composer.json
│   └── index.php
├── java/                      # Java Spring Boot
├── python/                    # Python Django/Flask
├── dotnet/                    # .NET Core
└── nestjs/                    # NestJS TypeScript
```

## 🌟 Best Practices Demonstrated

### Docker Best Practices
- **Multi-stage builds** for optimized production images
- **Non-root users** for security
- **Health checks** for service monitoring
- **Volume mounts** for development
- **Environment variables** for configuration

### Architecture Best Practices
- **Separation of concerns** (3-tier architecture)
- **Service discovery** via Docker networks
- **Load balancing** with Nginx
- **Database connection pooling**
- **Error handling and logging**

### Development Workflow
- **Hot reload** in development
- **Easy service isolation** for testing
- **Centralized logging** with Docker
- **Health monitoring** across all services
---

**Happy Dockerizing! 🐳**