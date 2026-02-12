# Partitionnement des Données

> **Session 3, Partie 1** - 25 minutes

## Objectifs d'Apprentissage

- [ ] Comprendre ce qu'est le partitionnement des données (sharding)
- [ ] Comparer le partitionnement basé sur le hachage vs par plage
- [ ] Apprendre comment le partitionnement affecte les performances des requêtes
- [ ] Reconnaître les compromis des différentes stratégies de partitionnement

## Qu'est-ce que le Partitionnement ?

Le **partitionnement des données** (aussi appelé **sharding**) est le processus de répartition de vos données sur plusieurs nœuds basé sur une clé de partitionnement. Chaque nœud contient un sous-ensemble des données totales.

```mermaid
graph TB
    subgraph "Vue de l'Application"
        App["Votre Application"]
        Data[("Toutes les Données")]
        App --> Data
    end

    subgraph "Réalité : Stockage Partitionné"
        Node1["Nœud 1<br/>Clés : user_1<br/>user_4<br/>user_7"]
        Node2["Nœud 2<br/>Clés : user_2<br/>user_5<br/>user_8"]
        Node3["Nœud 3<br/>Clés : user_3<br/>user_6<br/>user_9"]
    end

    App -->|"lecture/écriture"| Node1
    App -->|"lecture/écriture"| Node2
    App -->|"lecture/écriture"| Node3

    style Node1 fill:#e1f5fe
    style Node2 fill:#e1f5fe
    style Node3 fill:#e1f5fe
```

### Pourquoi Partitionner les Données ?

| Avantage | Description |
|---------|-------------|
| **Mise à l'échelle** | Stocker plus de données que ce qui tient sur une seule machine |
| **Performance** | Distribuer la charge sur plusieurs nœuds |
| **Disponibilité** | La défaillance d'une partition n'affecte pas les autres |

### Le Défi du Partitionnement

La question clé est : **Comment décider quelles données vont sur quel nœud ?**

```mermaid
graph LR
    Key["user:12345"] --> Router{Fonction de<br/>Partitionnement}
    Router -->|"hash(clé) % N"| N1[Nœud 1]
    Router --> N2[Nœud 2]
    Router --> N3[Nœud 3]

    style Router fill:#ff9,stroke:#333,stroke-width:3px
```

## Stratégies de Partitionnement

### 1. Partitionnement Basé sur le Hachage

Appliquer une fonction de hachage à la clé, puis modulo le nombre de nœuds :

```
nœud = hash(clé) % nombre_de_nœuds
```

```mermaid
graph TB
    subgraph "Partitionnement Basé sur le Hachage (3 nœuds)"
        Key1["user:alice"] --> H1["hash() % 3"]
        Key2["user:bob"] --> H2["hash() % 3"]
        Key3["user:carol"] --> H3["hash() % 3"]

        H1 -->|"= 1"| N1[Nœud 1]
        H2 -->|"= 2"| N2[Nœud 2]
        H3 -->|"= 0"| N0[Nœud 0]

        style N1 fill:#c8e6c9
        style N2 fill:#c8e6c9
        style N0 fill:#c8e6c9
    end
```

**Exemple TypeScript :**
```typescript
function getNode(key: string, totalNodes: number): number {
    // Fonction de hachage simple
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = ((hash << 5) - hash) + key.charCodeAt(i);
        hash = hash & hash; // Convertir en entier 32bit
    }
    return Math.abs(hash) % totalNodes;
}

// Exemples
console.log(getNode('user:alice', 3));  // => 1
console.log(getNode('user:bob', 3));    // => 2
console.log(getNode('user:carol', 3));  // => 0
```

**Exemple Python :**
```python
def get_node(key: str, total_nodes: int) -> int:
    """Déterminer quel nœud doit stocker cette clé."""
    hash_value = hash(key)  # Fonction de hachage intégrée
    return abs(hash_value) % total_nodes

# Exemples
print(get_node('user:alice', 3))   # => 1
print(get_node('user:bob', 3))     # => 2
print(get_node('user:carol', 3))   # => 0
```

**Avantages :**
- ✅ Distribution uniforme des données
- ✅ Simple à implémenter
- ✅ Pas de points chauds (en supposant une bonne fonction de hachage)

**Désavantages :**
- ❌ Ne permet pas des requêtes de plage efficaces
- ❌ Le rééquilibrage est coûteux lors de l'ajout/suppression de nœuds

### 2. Partitionnement Basé sur la Plage

Assigner des plages de clés à chaque nœud :

```mermaid
graph TB
    subgraph "Partitionnement Basé sur la Plage (3 nœuds)"
        R1["Nœud 1<br/>a-m"]
        R2["Nœud 2<br/>n-S"]
        R3["Nœud 3<br/>t-Z"]

        Key1["alice"] --> R1
        Key2["bob"] --> R1
        Key3["nancy"] --> R2
        Key4["steve"] --> R2
        Key5["tom"] --> R3
        Key6["zoe"] --> R3

        style R1 fill:#c8e6c9
        style R2 fill:#c8e6c9
        style R3 fill:#c8e6c9
    end
```

**Exemple TypeScript :**
```typescript
interface Range {
    start: string;
    end: string;
    node: number;
}

const ranges: Range[] = [
    { start: 'a', end: 'm', node: 1 },
    { start: 'n', end: 's', node: 2 },
    { start: 't', end: 'z', node: 3 }
];

function getNodeByRange(key: string): number {
    for (const range of ranges) {
        if (key >= range.start && key <= range.end) {
            return range.node;
        }
    }
    throw new Error(`Aucune plage trouvée pour la clé : ${key}`);
}

// Exemples
console.log(getNodeByRange('alice'));  // => 1
console.log(getNodeByRange('nancy'));  // => 2
console.log(getNodeByRange('tom'));    // => 3
```

**Exemple Python :**
```python
from typing import List, Tuple

ranges: List[Tuple[str, str, int]] = [
    ('a', 'm', 1),
    ('n', 's', 2),
    ('t', 'z', 3)
]

def get_node_by_range(key: str) -> int:
    """Déterminer quel nœud basé sur la plage de clés."""
    for start, end, node in ranges:
        if start <= key <= end:
            return node
    raise ValueError(f"Aucune plage trouvée pour la clé : {key}")

# Exemples
print(get_node_by_range('alice'))  # => 1
print(get_node_by_range('nancy'))  # => 2
print(get_node_by_range('tom'))    # => 3
```

**Avantages :**
- ✅ Requêtes de plage efficaces
- ✅ Peut optimiser pour les modèles d'accès aux données

**Désavantages :**
- ❌ Distribution inégale (points chauds)
- ❌ Complexe à équilibrer la charge

## Le Problème du Rééquilibrage

Que se passe-t-il lorsque vous ajoutez ou supprimez des nœuds ?

```mermaid
stateDiagram-v2
    [*] --> Stable: 3 Nœuds
    Stable --> Rééquilibrage: Ajouter Nœud 4
    Rééquilibrage --> Stable: Déplacer 25% des données
    Stable --> Rééquilibrage: Supprimer Nœud 2
    Rééquilibrage --> Stable: Redistribuer les données
```

### Problème du Hachage Modulo Simple

Avec `hash(clé) % N`, changer N de 3 à 4 signifie que **la plupart des clés se déplacent vers différents nœuds** :

| Clé | hash % 3 | hash % 4 | Déplacée ? |
|-----|----------|----------|--------------|
| user:1 | 1 | 1 | ❌ |
| user:2 | 2 | 2 | ❌ |
| user:3 | 0 | 3 | ✅ |
| user:4 | 1 | 0 | ✅ |
| user:5 | 2 | 1 | ✅ |
| user:6 | 0 | 2 | ✅ |

**75% des clés se sont déplacées !**

### Hachage Cohérent (Avancé)

Une technique pour minimiser le déplacement de données lorsque les nœuds changent :

```mermaid
graph TB
    subgraph "Anneau de Hachage"
        Ring["Anneau Virtuel (0 - 2^32)"]

        N1["Nœud 1<br/>position : 100"]
        N2["Nœud 2<br/>position : 500"]
        N3["Nœud 3<br/>position : 900"]

        K1["Clé A<br/>hash : 150"]
        K2["Clé B<br/>hash : 600"]
        K3["Clé C<br/>hash : 950"]
    end

    Ring --> N1
    Ring --> N2
    Ring --> N3

    K1 -->|"sens horaire"| N2
    K2 -->|"sens horaire"| N3
    K3 -->|"sens horaire"| N1

    style Ring fill:#f9f,stroke:#333,stroke-width:2px
```

**Idée Clé :** Chaque clé est assignée au premier nœud dans le sens horaire à partir de sa position de hachage.

Lors de l'ajout/suppression d'un nœud, seules les clés dans la plage de ce nœud se déplacent.

## Modèles de Requêtes et Partitionnement

Vos modèles de requêtes devraient influencer votre stratégie de partitionnement :

### Modèles de Requêtes Courants

| Type de Requête | Meilleur Partitionnement | Exemple |
|-----------------|----------------------|---------|
| **Recherches clé-valeur** | Basé sur le hachage | Obtenir un utilisateur par ID |
| **Analyses de plage** | Basé sur la plage | Utilisateurs inscrits la semaine dernière |
| **Accès multi-clés** | Hachage composite | Commandes par client |
| **Requêtes géographiques** | Basé sur la localisation | Restaurants proches |

### Exemple : Partitionnement des Données Utilisateur

```mermaid
graph TB
    subgraph "Application : Réseau Social"
        Query1["Obtenir le Profil Utilisateur<br/>SELECT * FROM users WHERE id = ?"]
        Query2["Lister les Amis<br/>SELECT * FROM friends WHERE user_id = ?"]
        Query3["Publications de Timeline<br/>SELECT * FROM posts WHERE created_at > ?"]
    end

    subgraph "Décision de Partitionnement"
        Query1 -->|"hash(user_id)"| Hash[Hachage]
        Query2 -->|"hash(user_id)"| Hash
        Query3 -->|"range(created_at)"| Range[Plage]
    end

    subgraph "Résultat"
        Hash --> H["Données utilisateur & amis<br/>partitionnées par user_id"]
        Range --> R["Publications partitionnées<br/>par plage de dates"]
    end
```

## Résumé des Compromis

| Stratégie | Distribution | Requêtes de Plage | Rééquilibrage | Complexité |
|----------|--------------|---------------|-------------|------------|
| **Basé sur le hachage** | Uniforme | Pauvre | Coûteux | Faible |
| **Basé sur la plage** | Potentiellement inégale | Excellent | Modéré | Moyen |
| **Hachage cohérent** | Uniforme | Pauvre | Minimal | Élevé |

## Exemples Réels

| Système | Stratégie de Partitionnement | Notes |
|--------|----------------------|-------|
| **Redis Cluster** | Slots de hachage (16384 slots) | Hachage cohérent |
| **Cassandra** | Sensible aux jetons (anneau de hachage) | Partitionneur configurable |
| **MongoDB** | Plages de clés de sharding | Basé sur la plage sur la clé de sharding |
| **DynamoDB** | Hachage + plage (composite) | Supporte les clés composites |
| **PostgreSQL** | Pas natif | Utiliser des extensions comme Citus |

## Résumé

### Points Clés à Retenir

1. **Le partitionnement divise les données** sur plusieurs nœuds pour la mise à l'échelle
2. **Le hachage** donne une distribution uniforme mais de mauvaises requêtes de plage
3. **La plage** permet les analyses de plage mais peut créer des points chauds
4. **Le rééquilibrage** est un défi clé lorsque les nœuds changent
5. **Les modèles de requêtes** devraient dicter votre stratégie de partitionnement

### Vérifiez Votre Compréhension

- [ ] Pourquoi le partitionnement basé sur le hachage est-il meilleur pour une distribution uniforme ?
- [ ] Quand choisiriez-vous le partitionnement par plage plutôt que par hachage ?
- [ ] Qu'arrive-t-il au placement des données lorsque vous ajoutez un nouveau nœud avec le hachage modulo simple ?
- [ ] Comment le hachage cohérent minimise-t-il le déplacement de données ?

## 🧠 Quiz du Chapitre

Testez votre maîtrise de ces concepts ! Ces questions mettront au défi votre compréhension et révéleront toute lacune dans vos connaissances.

{{#quiz ../../quizzes/data-store-partitioning.toml}}

## Et Ensuite

Maintenant que nous comprenons comment partitionner les données, explorons les compromis fondamentaux dans les systèmes de données distribués : [Théorème CAP](./02-cap-theorem.md)
