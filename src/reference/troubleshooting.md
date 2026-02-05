# Troubleshooting

Common issues and solutions when working with the course examples.

## Docker Issues

### Port Already in Use

```
Error: bind: address already in use
```

**Solution:** Change the port in docker-compose.yml or stop the conflicting service.

### Permission Denied

```
Error: permission denied while trying to connect to the Docker daemon
```

**Solution:** Add your user to the docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## Build Issues

### TypeScript: Module Not Found

**Solution:** Install dependencies:
```bash
npm install
```

### Python: Module Not Found

**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

## Runtime Issues

### Connection Refused

**Solution:** Check that all services are running:
```bash
docker-compose ps
```

### Node Can't Connect to Peers

**Solution:** Verify network configuration in docker-compose.yml. Ensure all nodes are on the same network.

## Getting Help

If you encounter issues not covered here:

1. Check the Docker logs: `docker-compose logs`
2. Verify your Docker installation: `docker --version`
3. See [Further Reading](./further-reading.md) for additional resources
