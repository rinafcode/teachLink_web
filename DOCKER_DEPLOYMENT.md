# Docker Deployment Guide

This document provides comprehensive instructions for building, running, and deploying the TeachLink application using Docker.

## Architecture

The Docker setup uses **multi-stage builds** to optimize:
- **Build Stage**: Compiles Next.js and validates i18n configuration
- **Runtime Stage**: Lean production image with minimal dependencies

### Image Optimization
- Base image: `node:20-alpine` (~150MB)
- Production image size: ~250-300MB (after build)
- Development image: Includes dev dependencies for fast iteration

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git

## Development Setup

### Quick Start (Hot Reload)

```bash
# Start development environment with hot-reload
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Access the app at http://localhost:3000
```

### Development Features

- **Volume Mounts**: Source code changes immediately reflected
- **Hot Reload**: Next.js dev server with Turbopack
- **Network**: Isolated `teachlink-network` for scalability
- **Logs**: Available at `./logs` directory

### Rebuild Containers

```bash
# Full rebuild
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Remove old images
docker-compose down
docker system prune -a
```

## Production Deployment

### Build Production Image

```bash
# Build the production image
docker build -t teachlink:latest .

# Tag for registry (example: DockerHub)
docker tag teachlink:latest yourusername/teachlink:latest
docker tag teachlink:latest yourusername/teachlink:1.0.0
```

### Run Production Container

#### Using docker-compose (Recommended)

```bash
# Start production services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

#### Using docker directly

```bash
docker run -d \
  --name teachlink-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e NEXT_TELEMETRY_DISABLED=1 \
  --restart unless-stopped \
  --health-cmd='node -e "require('"'"'http'"'"').get('"'"'http://localhost:3000/api/health'"'"', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"' \
  --health-interval=30s \
  --health-timeout=3s \
  --health-start-period=5s \
  --health-retries=3 \
  teachlink:latest
```

## Environment Configuration

### Production Variables

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

Add other required environment variables in `docker-compose.yml` or pass via `-e` flag.

### Development Variables

```env
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

## Health Checks

### Endpoint

The container includes a built-in health check that calls `/api/health`.

Ensure your app has this endpoint:

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'healthy' }, { status: 200 });
}
```

### Manual Health Check

```bash
docker exec teachlink-app node -e "require('http').get('http://localhost:3000/api/health', (r) => console.log(r.statusCode))"
```

## Security Best Practices

### Image Scanning

```bash
# Scan for vulnerabilities (requires Trivy)
trivy image teachlink:latest
```

### Non-Root User

The production image runs as `nextjs` (UID 1001) for security.

### Network Isolation

- Services run on `teachlink-network`
- Only expose necessary ports
- Use environment variables for sensitive data

## Scaling

### Multiple Instances with Load Balancing

```yaml
# docker-compose.yml example
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

  app:
    build: .
    deploy:
      replicas: 3
```

## Troubleshooting

### Container Won't Start

```bash
# View logs
docker-compose logs app

# Inspect image
docker inspect teachlink:latest

# Run interactive shell
docker run -it --entrypoint /bin/sh teachlink:latest
```

### High Memory Usage

```bash
# Check memory consumption
docker stats teachlink-app

# Limit memory in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 512M
    reservations:
      memory: 256M
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Change port in docker-compose.yml
ports:
  - "3001:3000"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: yourusername/teachlink:latest
          cache-from: type=registry,ref=yourusername/teachlink:buildcache
          cache-to: type=registry,ref=yourusername/teachlink:buildcache,mode=max
```

## Cleanup

```bash
# Stop all containers
docker-compose down

# Remove unused images
docker image prune

# Remove all Docker resources
docker system prune -a --volumes
```

## Reference

- [Next.js Docker Documentation](https://nextjs.org/docs/deployment/docker)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Alpine Linux Benefits](https://www.alpinelinux.org/)
