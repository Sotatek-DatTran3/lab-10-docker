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

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Docker Swarm (for production deployment)
- 8GB+ RAM recommended
- Ports 3000, 8000-8005, 5432, 3306, 27017, 6379 available

### Development Setup (Docker Compose)

```bash
# Clone the repository
git clone <your-repo-url>
cd lab10-docker

# Start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f [service-name]

# Stop all services
docker compose down
```

## 📊 Service Status & Testing

All services provide health endpoints for monitoring:

| Service | Port | Health Check | Database |
|---------|------|-------------|----------|
| Node.js | 8000 | http://localhost:8000/health | MongoDB + PostgreSQL |
| Java | 8002 | http://localhost:8002/health | PostgreSQL |
| Python | 8003 | http://localhost:8003/health | PostgreSQL |
| .NET | 8004 | http://localhost:8004/health | PostgreSQL |
| NestJS | 8005 | http://localhost:8005/health | PostgreSQL |
| React | 3000 | http://localhost:3000 | Static Files |
| PHP | 8001/8080 | http://localhost:8080/health | MySQL |

### Health Check Script
```bash
# Test all backends
curl http://localhost:8000/health  # Node.js
curl http://localhost:8002/health  # Java  
curl http://localhost:8003/health  # Python
curl http://localhost:8004/health  # .NET
curl http://localhost:8005/health  # NestJS
curl http://localhost:3000         # React Frontend
```

## 🐳 Docker Swarm Deployment

### Initialize Swarm
```bash
# Initialize swarm on manager node
docker swarm init

# Join workers (run on worker nodes)
docker swarm join --token <worker-token> <manager-ip>:2377

# Label nodes for placement constraints
docker node update --label-add database=true <node-name>
docker node update --label-add compute=true <node-name>
```

### Deploy Stack
```bash
# Deploy the complete stack
docker stack deploy -c docker-stack.yml lab10-stack

# Check stack status
docker stack services lab10-stack
docker stack ps lab10-stack

# Scale services
docker service scale lab10-stack_nodejs-backend=3
docker service scale lab10-stack_java-backend=2

# Remove stack
docker stack rm lab10-stack
```

### Swarm Features
- **Load Balancing**: Nginx load balancer with 2 replicas
- **High Availability**: Database services with placement constraints
- **Auto Restart**: Services restart on failure
- **Scaling**: Horizontal scaling for all backend services
- **Overlay Networks**: Secure inter-service communication
./scripts/manage.sh start

# Or manually with Docker Compose
docker compose up -d
```

### 3. Access Applications
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost/api/{service}/
- **Health Checks**: http://localhost:{port}/health

## 📋 Available Commands

Use the management script for easy operations:

```bash
# Basic Operations
./scripts/manage.sh start         # Start all services
./scripts/manage.sh stop          # Stop all services  
./scripts/manage.sh status        # Show service URLs
./scripts/manage.sh test          # Test all backends

# Development
./scripts/manage.sh build         # Build all images
./scripts/manage.sh logs [service] # View logs

# Production (Docker Swarm)
./scripts/manage.sh init-swarm    # Initialize Swarm
./scripts/manage.sh deploy        # Deploy to Swarm
./scripts/manage.sh remove-stack  # Remove from Swarm

# Maintenance
./scripts/manage.sh cleanup       # Clean up containers/images
```

## 🔧 Service Details

### Frontend (React)
- **Port**: 3000
- **Features**: Health dashboard, API testing, responsive UI
- **Build**: Multi-stage Dockerfile with Nginx

### Backend Services

#### Node.js (Express)
- **Port**: 8000
- **Database**: MongoDB + PostgreSQL + Redis
- **Features**: RESTful API, database connections, middleware

#### PHP (PHP-FPM)
- **Port**: 8080 (via Nginx)
- **Database**: MySQL + Redis
- **Features**: Modern PHP 8.2, Composer dependencies

#### Java (Spring Boot)
- **Port**: 8002
- **Database**: PostgreSQL
- **Features**: Spring Web, JPA, health actuator

#### Python (Django/Flask)
- **Port**: 8003
- **Database**: PostgreSQL + Redis
- **Features**: ORM, admin interface, REST framework

#### .NET Core
- **Port**: 8004
- **Database**: SQL Server
- **Features**: Entity Framework, Web API, health checks

#### NestJS (TypeScript)
- **Port**: 8005
- **Database**: PostgreSQL + Redis
- **Features**: Decorators, dependency injection, TypeORM

### Databases
- **PostgreSQL**: Port 5432 (for Java, Python, NestJS)
- **MongoDB**: Port 27017 (for Node.js)
- **MySQL**: Port 3306 (for PHP)
- **SQL Server**: Port 1433 (for .NET)
- **Redis**: Port 6379 (caching for multiple services)

## 🐳 Docker Configuration

### Development (docker-compose.yml)
- Hot reload with volume mounts
- Environment-specific configurations
- Database initialization scripts
- Health checks and dependencies

### Production (docker-stack.yml)
- Multi-replica deployments
- Load balancing with Nginx
- Resource limits and reservations
- Rolling updates and placement constraints

## 📁 Project Structure

```
lab10-docker/
├── docker-compose.yml          # Development orchestration
├── docker-stack.yml           # Production Swarm deployment
├── scripts/
│   └── manage.sh              # Management script
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

## 📊 Monitoring and Testing

### Health Checks
Each backend service provides a `/health` endpoint returning:
```json
{
  "service": "Service Name",
  "version": "1.0.0", 
  "timestamp": "2024-01-01T00:00:00Z",
  "database": "Connected",
  "uptime": 3600
}
```

### Testing Commands
```bash
# Test all backends
./scripts/manage.sh test

# Individual service testing
curl http://localhost:8000/health  # Node.js
curl http://localhost:8080/health  # PHP
curl http://localhost:8002/health  # Java
curl http://localhost:8003/health  # Python
curl http://localhost:8004/health  # .NET
curl http://localhost:8005/health  # NestJS
```

## 🔧 Customization

### Adding New Services
1. Create service directory with Dockerfile
2. Add service to `docker-compose.yml`
3. Add service to `docker-stack.yml` for production
4. Update management script if needed

### Environment Configuration
- Copy `.env.example` to `.env` for custom settings
- Modify database credentials and URLs
- Adjust resource limits in Docker Compose

## 🚀 Production Deployment

### Docker Swarm Setup
```bash
# Initialize Swarm (if not already done)
./scripts/manage.sh init-swarm

# Deploy stack
./scripts/manage.sh deploy

# Monitor deployment
docker stack ps lab10-stack
docker service ls
```

### Scaling Services
```bash
# Scale specific services
docker service scale lab10-stack_nodejs-backend=5
docker service scale lab10-stack_react-frontend=3
```

## 📚 Learning Objectives

This lab teaches:
- ✅ **3-tier architecture** design patterns
- ✅ **Docker containerization** across multiple languages
- ✅ **Docker Compose** for development orchestration  
- ✅ **Docker Swarm** for production deployment
- ✅ **Multi-database** integration strategies
- ✅ **Service communication** and networking
- ✅ **Load balancing** and reverse proxy setup
- ✅ **Health monitoring** and observability

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000-8005 are available
2. **Memory issues**: Increase Docker memory limit to 8GB+
3. **Database connections**: Wait for databases to fully start
4. **Permission errors**: Ensure proper file permissions

### Useful Debug Commands
```bash
# View service logs
docker compose logs [service-name]

# Inspect container
docker inspect [container-name]

# Execute into container
docker exec -it [container-name] sh

# Check resource usage
docker stats

# View networks
docker network ls
```

## 📖 References

### Excellent GitHub Examples
- **MERN Stack**: `microsoft/vscode-docker/examples`
- **PHP LEMP**: `laradock/laradock`
- **Spring Boot**: `spring-guides/gs-spring-boot-docker`
- **Django**: `docker/awesome-compose/django`
- **ASP.NET**: `dotnet/dotnet-docker/samples`
- **NestJS**: `nestjs/nest/sample`

### Documentation
- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Docker Swarm Tutorial](https://docs.docker.com/engine/swarm/)
- [3-Tier Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/)

---

**Happy Dockerizing! 🐳**