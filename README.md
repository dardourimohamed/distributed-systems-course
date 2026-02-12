# Cours de Systèmes Distribués (Distributed Systems Course)

Un cours complet sur les systèmes distribués, des fondamentaux au consensus, implémenté avec mdBook.

## Auteur

**Mohamed Dardouri**

- Email: [email protected]
- Site Web : [https://med.dardouri.com](https://med.dardouri.com)
- LinkedIn : [linkedin.com/in/dardourimohamed](https://linkedin.com/in/dardourimohamed)
- X/Twitter : [@DardouriMohamed](https://x.com/DardouriMohamed)

## Démarrage Rapide

### Prérequis

1. Installez [mdBook](https://rust-lang.github.io/mdBook/guide/installation.html) :
   ```bash
   cargo install mdbook
   cargo install mdbook-mermaid
   ```

2. Installez [Docker](https://docs.docker.com/get-docker/) et Docker Compose

### Construire le Livre

```bash
cd distributed-systems-course
mdbook build
mdbook serve  # Aperçu sur http://localhost:3000
```

## Structure du Cours

Ce cours consiste en 10 sessions (15 heures au total) couvrant :

| Partie | Sessions | Sujets |
|-------|----------|--------|
| I | 1-2 | Système de File/Travail (Queue/Work) - Producteur-consommateur, passage de messages |
| II | 3-5 | Magasin avec Réplication - CAP, élection de leader, cohérence |
| III | 6-7 | Système de Chat - WebSockets, pub/sub, ordonnancement des messages |
| IV | 8-10 | Système de Consensus - Algorithme Raft, réplication de journal |

## Exemples de Code

Tous les exemples incluent **à la fois des implémentations en TypeScript et en Python**. Chaque session comprend :
- Explication des concepts avec diagrammes
- Exemples de code fonctionnels
- Déploiement Docker Compose
- Exercices pratiques

## Organisation des Répertoires

```
distributed-systems-course/
├── book.toml              # Configuration mdBook
├── src/                   # Contenu du cours
│   ├── SUMMARY.md         # Table des matières
│   ├── fundamentals/      # Sessions 1-2
│   ├── data-store/        # Sessions 3-5
│   ├── real-time/         # Sessions 6-7
│   ├── consensus/         # Sessions 8-10
│   └── reference/         # Matériels de référence
└── examples/              # Exemples Docker Compose
    ├── 01-queue/
    ├── 02-store/
    ├── 03-chat/
    └── 04-consensus/
```

## Licence

Licence MIT - voir le fichier LICENSE pour les détails
