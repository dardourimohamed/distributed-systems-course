# Dépannage

Problèmes courants et solutions lors de l'utilisation des exemples du cours.

## Problèmes Docker

### Port Déjà Utilisé

```
Error: bind: address already in use
```

**Solution :** Changez le port dans docker-compose.yml ou arrêtez le service en conflit.

### Permission Refusée

```
Error: permission denied while trying to connect to the Docker daemon
```

**Solution :** Ajoutez votre utilisateur au groupe docker :
```bash
sudo usermod -aG docker $USER
newgrp docker
```

## Problèmes de Build

### TypeScript : Module Non Trouvé

**Solution :** Installez les dépendances :
```bash
npm install
```

### Python : Module Non Trouvé

**Solution :** Installez les dépendances :
```bash
pip install -r requirements.txt
```

## Problèmes d'Exécution

### Connexion Refusée

**Solution :** Vérifiez que tous les services sont en cours d'exécution :
```bash
docker-compose ps
```

### Le Nœud ne Peut pas se Connecter aux Pairs

**Solution :** Vérifiez la configuration réseau dans docker-compose.yml. Assurez-vous que tous les nœuds sont sur le même réseau.

## Obtenir de l'Aide

Si vous rencontrez des problèmes non couverts ici :

1. Consultez les journaux Docker : `docker-compose logs`
2. Vérifiez votre installation Docker : `docker --version`
3. Voir [Pour Aller Plus Loin](./further-reading.md) pour des ressources supplémentaires
