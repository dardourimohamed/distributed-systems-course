# Corrigé — Examen Final WebSockets et Consensus Raft

> Cours de Systèmes Distribués — Corrigé de l'examen de fin de module

## Partie A : WebSockets

| Question | Réponse | Explication |
|----------|---------|-------------|
| Q1 | **B** | HTTP est half-duplex (requête-réponse), WebSocket est full-duplex (bidirectionnel). Une seule connexion TCP persistante suffit. |
| Q2 | **B** | La connexion WebSocket commence par une requête HTTP avec l'en-tête `Upgrade: websocket`. Le serveur répond `101 Switching Protocols` pour confirmer la mise à niveau. |
| Q3 | **B** | Connecting → Open → Messaging → Closing → Closed. Le client envoie d'abord un HTTP Upgrade, puis la connexion s'ouvre, les messages s'échangent, et la fermeture se fait proprement. |
| Q4 | **B** | Le mécanisme ping/pong (heartbeat) à intervalle régulier permet au serveur de détecter les connexions inactives et de les nettoyer. |
| Q5 | **C** | Les opérations CRUD simples n'ont pas besoin de communication en temps réel bidirectionnelle. REST est plus adapté. |
| Q6 | *Réponse attendue* : Idéal pour les applications temps réel (chat, jeux multijoueurs, tableaux de bord en direct). Pas idéal pour les opérations CRUD simples ou la récupération de données unique (mieux vaut HTTP/REST). |

## Partie B : Consensus Raft

### Raft — Généralités

| Question | Réponse | Explication |
|----------|---------|-------------|
| Q7 | **B** | Le split-brain se produit quand les nœuds ne se coordonnent pas et ont des visions différentes de l'état du système. |
| Q8 | **B** | Un chef unique simplifie la coordination : toutes les décisions passent par un seul nœud, ce qui évite les conflits sur l'ordre des opérations. |
| Q9 | **C** | Raft a été créé en 2014 avec pour objectif d'être compréhensible et facile à implémenter, contrairement à Paxos qui est notoirement difficile à comprendre. |
| Q10 | **C** | Raft sépare le consensus en deux phases claires : d'abord élire un chef, puis le chef réplique les décisions. |
| Q11 | *Réponse attendue* : **Phase 1 — Élection** : les nœuds élisent un chef unique via des votes à la majorité. **Phase 2 — Réplication** : le chef reçoit les commandes des clients et les réplique sur les suiveurs via AppendEntries. |

### Raft — Élection de Leader

| Question | Réponse | Explication |
|----------|---------|-------------|
| Q12 | **C** | Un suiveur attend des battements de cœur réguliers du chef. Si le délai expire sans battement, il devient candidat. |
| Q13 | **B** | Les mandats ne font qu'augmenter. Si un nœud découvre un mandat supérieur, il doit immédiatement redevenir suiveur. |
| Q14 | **C** | La règle « un seul vote par nœud et par mandat » empêche deux candidats d'obtenir la majorité dans le même mandat. |
| Q15 | *Réponse attendue* : Pour éviter les votes partagés (split votes). Si tous les nœuds avaient le même délai, ils deviendraient candidats en même temps et personne n'obtiendrait la majorité. Les délais aléatoires décalent les candidatures. |

### Raft — Réplication de Journal

| Question | Réponse | Explication |
|----------|---------|-------------|
| Q16 | **B** | Chaque entrée contient un index (numéro de page), un numéro de mandat (quel chef a ajouté cette entrée) et une commande (la décision). |
| Q17 | **B** | Si deux journaux sont identiques à un index donné, tout ce qui précède est aussi identique. C'est la Règle d'Or de Raft. |
| Q18 | **C** | Une entrée est validée dès que la majorité des nœuds l'ont dans leur journal. Pas besoin d'unanimité — la majorité suffit. |
| Q19 | **C** | Le chef recule jusqu'à trouver le point de divergence, puis envoie les entrées correctes qui écrasent les incorrectes. Ce processus est automatique. |
| Q20 | *Réponse attendue* : Oui, l'entrée est validée car 3 sur 5 est la majorité. Raft avance à la vitesse de la majorité, pas du plus lent. Les 2 suiveurs restants seront mis à jour plus tard. |

### Raft — En Action

| Question | Réponse | Explication |
|----------|---------|-------------|
| Q21 | **C** | Les suiveurs attendent des battements de cœur réguliers. Quand le délai expire sans battement, ils déclenchent une élection. |
| Q22 | **D** | Avec 2 nœuds sur 5, impossible d'obtenir la majorité (3/5 nécessaire). Les élections échouent et aucune entrée ne peut être validée. C'est la sécurité contre le split-brain. |
| Q23 | **B** | Les mandats ne font qu'augmenter. Dès qu'un nœud découvre un mandat supérieur, il doit redevenir suiveur. L'ancien chef se soumet automatiquement. |
| Q24 | *Réponse attendue* : (a) **Oui** — tous les nœuds doivent être strictement d'accord sur les données, le consensus est nécessaire. (b) **Non** — un cache CDN n'exige pas que tous les nœuds voient exactement la même donnée au même instant, la cohérence éventuelle suffit. |
