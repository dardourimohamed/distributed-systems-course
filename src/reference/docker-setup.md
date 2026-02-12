# Configuration Docker

Ce guide couvre l'installation de Docker et Docker Compose pour exécuter les exemples du cours.

## Installation de Docker

### Linux

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### macOS

Téléchargez Docker Desktop depuis [docker.com](https://www.docker.com/products/docker-desktop)

### Windows

Téléchargez Docker Desktop depuis [docker.com](https://www.docker.com/products/docker-desktop)

## Vérifier l'Installation

```bash
docker --version
docker-compose --version
```

## Exécuter les Exemples du Cours

Chaque chapitre inclut un fichier Docker Compose :

```bash
cd examples/01-queue
docker-compose up
```

## Commandes Courantes

```bash
# Démarrer les services
docker-compose up

# Démarrer en arrière-plan
docker-compose up -d

# Voir les journaux
docker-compose logs

# Arrêter les services
docker-compose down

# Reconstruire après des changements de code
docker-compose up --build
```

## Dépannage

Voir [Dépannage](./troubleshooting.md) pour les problèmes courants.
