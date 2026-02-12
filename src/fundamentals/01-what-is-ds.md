# Qu'est-ce qu'un Système Distribué ?

> **Session 1, Partie 1** - 20 minutes

## Objectifs d'Apprentissage

- [ ] Définir ce qu'est un système distribué
- [ ] Identifier les caractéristiques clés des systèmes distribués
- [ ] Comprendre pourquoi les systèmes distribués sont importants
- [ ] Reconnaître les systèmes distribués dans la vie quotidienne

## Définition

Un **système distribué (distributed system)** est une collection d'ordinateurs indépendants qui apparaît à ses utilisateurs comme un système cohérent unique.

```mermaid
graph TB
    subgraph "Utilisateurs Voient"
        Single["Système Unique"]
    end

    subgraph "Réalité"
        N1["Nœud 1"]
        N2["Nœud 2"]
        N3["Nœud 3"]
        N4["Nœud N"]

        N1 <--> N2
        N2 <--> N3
        N3 <--> N4
        N4 <--> N1
    end

    Single -->|"apparaît comme"| N1
    Single -->|"apparaît comme"| N2
    Single -->|"apparaît comme"| N3
```

### Idée Clé

La caractéristique déterminante est l'**illusion d'unité** — les utilisateurs interagissent avec ce qui semble être un seul système, tandis qu'en coulisses, plusieurs machines travaillent ensemble.

## Trois Caractéristiques Clés

Selon Leslie Lamport, un système distribué est :

> "Un système dans lequel la défaillance d'un ordinateur dont vous ignoriez même l'existence peut rendre votre propre ordinateur inutilisable."

Cette définition met en évidence trois caractéristiques fondamentales :

### 1. Concurrence (Plusieurs Choses Se Produisent En Même Temps)

Plusieurs composants s'exécutent simultanément, entraînant des interactions complexes.

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant A as Serveur A
    participant B as Serveur B
    participant C as Serveur C

    U->>A: Requête
    A->>B: Requête
    A->>C: Mise à jour
    B-->>A: Réponse
    C-->>A: Accusé
    A-->>U: Résultat
```

### 2. Pas d'Horloge Globale

Chaque nœud a sa propre horloge. Il n'y a pas de "maintenant" unique dans le système.

```mermaid
graph LR
    A[Horloge A : 10:00:01.123]
    B[Horloge B : 10:00:02.456]
    C[Horloge C : 09:59:59.789]

    A -.->|latence réseau| B
    B -.->|latence réseau| C
    C -.->|latence réseau| A
```

**Implication :** Vous ne pouvez pas compter sur les horodatages pour ordonner les événements entre les nœuds. Vous avez besoin d'horloges logiques (nous en reparlerons dans les prochaines sessions !).

### 3. Défaillance Indépendante

Les composants peuvent tomber en panne indépendamment. Lorsqu'une partie tombe en panne, le reste peut continuer — ou peut devenir inutilisable.

```mermaid
stateDiagram-v2
    [*] --> TousSains: Démarrage Système
    TousSains --> DéfaillancePartielle: Un Nœud Tombe en Panne
    TousSains --> DéfaillanceComplète: Nœuds Critiques Tombent en Panne
    DéfaillancePartielle --> TousSains: Récupération
    DéfaillancePartielle --> DéfaillanceComplète: Défaillance en Cascade
    DéfaillanceComplète --> [*]
```

## Pourquoi des Systèmes Distribués ?

### Extensibilité

**Mise à l'échelle Verticale (Scale Up) :**
- Ajouter plus de ressources à une seule machine
- Finit par atteindre les limites matérielles/coût

**Mise à l'échelle Horizontale (Scale Out) :**
- Ajouter plus de machines au système
- Potentiel d'extensibilité pratiquement illimité

```mermaid
graph TB
    subgraph "Mise à l'échelle Verticale"
        Big[Gros Serveur Coûteux<br/>100 000 $]
    end

    subgraph "Mise à l'échelle Horizontale"
        S1[Serveur Standard<br/>1 000 $]
        S2[Serveur Standard<br/>1 000 $]
        S3[Serveur Standard<br/>1 000 $]
        S4[...]
    end

    Big <--> S1
    Big <--> S2
    Big <--> S3
```

### Fiabilité et Disponibilité

Un point unique de défaillance est inacceptable pour les services critiques :

```mermaid
graph TB
    subgraph "Système Unique"
        S[Serveur Unique]
        S -.-> X[❌ Défaillance = Pas de Service]
    end

    subgraph "Système Distribué"
        N1[Nœud 1]
        N2[Nœud 2]
        N3[Nœud 3]

        N1 <--> N2
        N2 <--> N3
        N3 <--> N1

        N1 -.-> X2[❌ Un Tombe en Panne]
        X2 --> OK[✓ Les Autres Continuent]
    end
```

### Latence (Distribution Géographique)

Placer les données plus près des utilisateurs améliore l'expérience :

```mermaid
graph TB
    User[Utilisateur à New York]

    subgraph "Distribution Globale"
        NYC[Centre de Données NYC<br/>latence 10ms]
        LON[Centre de Données Londres<br/>latence 70ms]
        TKY[Centre de Données Tokyo<br/>latence 150ms]
    end

    User --> NYC
    User -.-> LON
    User -.-> TKY

    NYC <--> LON
    LON <--> TKY
    TKY <--> NYC
```

## Exemples de Systèmes Distribués

### Exemples Quotidiens

| Système | Description | Avantage |
|--------|-------------|---------|
| **Recherche Web** | Serveurs de requêtes, serveurs d'index, serveurs de cache | Réponses rapides, toujours disponibles |
| **Vidéo en Streaming** | Réseaux de diffusion de contenu (CDNs) | Faible latence, haute qualité |
| **Achats en Ligne** | Catalogue de produits, panier, paiement, inventaire | Gère les pics de trafic |
| **Réseaux Sociaux** | Publications, commentaires, j'aime, notifications | Mises à jour en temps réel |

### Exemples Techniques

**Réplication de Base de Données :**
```mermaid
graph LR
    W[Écrire sur le Primaire] --> P[(DB Primaire)]
    P --> R1[(Réplique 1)]
    P --> R2[(Réplique 2)]
    P --> R3[(Réplique 3)]
    R1 --> Read1[Lire depuis la Réplique]
    R2 --> Read2[Lire depuis la Réplique]
    R3 --> Read3[Lire depuis la Réplique]
```

**Répartition de Charge :**
```mermaid
graph TB
    Users[Utilisateurs]
    LB[Répartiteur de Charge]

    Users --> LB
    LB --> S1[Serveur 1]
    LB --> S2[Serveur 2]
    LB --> S3[Serveur 3]
    LB --> S4[Serveur N]
```

## Compromis

Les systèmes distribués introduisent de la complexité :

| Défi | Description |
|-----------|-------------|
| **Problèmes Réseau** | Non fiable, latence variable, partitions |
| **Concurrence** | Conditions de course, interblocages, coordination |
| **Défaillances Partielles** | Certains composants fonctionnent, d'autres non |
| **Cohérence** | Garder les données synchronisées entre les nœuds |

**Le Dilemme Fondamental :**
> "Les avantages de la distribution valent-ils la complexité ajoutée ?"

Pour la plupart des applications modernes, la réponse est **oui** — c'est pourquoi nous apprenons ceci !

## Résumé

### Points Clés à Retenir

1. **Systèmes distribués** = plusieurs ordinateurs agissant comme un seul
2. **Trois caractéristiques :** concurrence, pas d'horloge globale, défaillance indépendante
3. **Avantages :** extensibilité, fiabilité, latence réduite
4. **Coûts :** complexité, problèmes réseau, défis de cohérence

### Vérifiez Votre Compréhension

- [ ] Pouvez-vous expliquer pourquoi il n'y a pas d'horloge globale dans un système distribué ?
- [ ] Donnez un exemple de système distribué que vous utilisez quotidiennement
- [ ] Pourquoi la défaillance indépendante rend-elle les systèmes distribués plus difficiles à construire ?

## 🧠 Quiz du Chapitre

Testez votre maîtrise de ces concepts ! Ces questions mettront au défi votre compréhension et révéleront les lacunes dans vos connaissances.

{{#quiz ../../quizzes/fundamentals-what-is-ds.toml}}

## Suite

Maintenant que nous comprenons ce que sont les systèmes distribués, explorons comment ils communiquent : [Passage de Messages](./02-message-passing.md)
