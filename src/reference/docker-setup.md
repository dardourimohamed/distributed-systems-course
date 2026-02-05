# Docker Setup

This guide covers installing Docker and Docker Compose for running the course examples.

## Installing Docker

### Linux

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### macOS

Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

### Windows

Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop)

## Verify Installation

```bash
docker --version
docker-compose --version
```

## Running Course Examples

Each chapter includes a Docker Compose file:

```bash
cd examples/01-queue
docker-compose up
```

## Common Commands

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build
```

## Troubleshooting

See [Troubleshooting](./troubleshooting.md) for common issues.
