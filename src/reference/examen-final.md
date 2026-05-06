# Examen Final — WebSockets et Consensus Raft

---

## Partie A : WebSockets (5 points)

### Questions à Choix Multiples (5 × 0,5 = 2,5 points)

**Q1.** Quelle est la principale différence entre HTTP et WebSocket ?

- A) HTTP est plus rapide que WebSocket
- B) HTTP est half-duplex (requête-réponse), WebSocket est full-duplex (bidirectionnel)
- C) WebSocket nécessite deux connexions TCP, une dans chaque sens
- D) HTTP et WebSocket utilisent le même protocole, seule la syntaxe change

**Q2.** Comment une connexion WebSocket est-elle établie ?

- A) Le client envoie directement une trame WebSocket sans passer par HTTP
- B) Le client envoie une requête HTTP avec l'en-tête `Upgrade: websocket`, le serveur répond `101 Switching Protocols`
- C) Le serveur ouvre une connexion WebSocket et attend que le client s'y connecte
- D) Le client et le serveur échangent une clé secrète via FTP avant de basculer en WebSocket

**Q3.** Quel est le bon ordre du cycle de vie d'une connexion WebSocket ?

- A) Open → Connecting → Messaging → Closing → Closed
- B) Connecting → Open → Messaging → Closing → Closed
- C) Messaging → Connecting → Open → Closing → Closed
- D) Connecting → Messaging → Open → Closed → Closing

**Q4.** Quelle bonne pratique permet de détecter les connexions obsolètes (stale connections) ?

- A) Envoyer un message toutes les secondes à tous les clients
- B) Utiliser un mécanisme de ping/pong (heartbeat) à intervalle régulier
- C) Fermer et rouvrir la connexion toutes les 30 secondes
- D) Augmenter la taille du buffer de réception

**Q5.** Parmi ces applications, laquelle n'est **pas** un bon cas d'usage pour les WebSockets ?

- A) Une application de chat en temps réel
- B) Un jeu multijoueur en ligne
- C) Une opération CRUD simple (créer, lire, mettre à jour, supprimer)
- D) Un tableau de bord de monitoring en direct

### Question à Réponse Courte (2,5 points)

**Q6.** Citez un cas d'usage idéal pour les WebSockets et un cas où il vaut mieux utiliser HTTP classique.

---

## Partie B : Consensus Raft (15 points)

### Raft — Généralités (4 points)

#### Questions à Choix Multiples (4 × 0,5 = 2 points)

**Q7.** Qu'est-ce qu'un « split-brain » dans un système distribué ?

- A) Un nœud qui redémarre après une panne
- B) Les nœuds ont des visions différentes de l'état du système
- C) Un message qui arrive en double sur le réseau
- D) Un algorithme de consensus distribué

**Q8.** Pourquoi Raft utilise-t-il un chef unique (leader fort) ?

- A) Pour réduire le nombre de messages réseau
- B) Pour simplifier la coordination — toutes les décisions passent par un seul nœud
- C) Pour que les clients n'aient qu'une seule adresse à contacter
- D) Pour éviter d'avoir à répliquer les données

**Q9.** Quel est le principal avantage de Raft par rapport à Paxos ?

- A) Raft est plus rapide en termes de latence
- B) Raft nécessite moins de nœuds
- C) Raft est conçu pour être compréhensible et facile à implémenter
- D) Raft ne nécessite pas de chef

**Q10.** En quoi Raft décompose-t-il le problème du consensus ?

- A) En trois phases : proposition, vote, exécution
- B) En une seule phase où tous les nœuds votent simultanément
- C) En deux phases : élection d'un chef, puis réplication des décisions
- D) En quatre phases correspondant aux quatre propriétés du consensus

#### Question à Réponse Courte (2 points)

**Q11.** Quelles sont les deux phases principales de Raft ? Décrivez brièvement chacune.

---

### Raft — Élection de Leader (3,5 points)

#### Questions à Choix Multiples (3 × 0,5 = 1,5 points)

**Q12.** Qu'est-ce qui pousse un suiveur à devenir candidat et lancer une élection ?

- A) Il reçoit une requête d'un client
- B) Son journal devient trop grand
- C) Son délai d'attente expire — il n'a pas reçu de battement de cœur du chef
- D) Un autre candidat lui demande de se présenter

**Q13.** Que se passe-t-il quand un nœud découvre un numéro de mandat supérieur au sien ?

- A) Il ignore le message et continue
- B) Il redescend immédiatement au rang de suiveur
- C) Il lance immédiatement une nouvelle élection
- D) Il redémarre complètement

**Q14.** Parmi ces trois règles de vote, laquelle garantit qu'un seul chef peut être élu par mandat ?

- A) Le mandat du candidat doit être inférieur au mien
- B) Le journal du candidat doit être à jour
- C) Chaque nœud ne peut voter qu'une seule fois par mandat
- D) Le candidat doit avoir envoyé un battement de cœur

#### Question à Réponse Courte (2 points)

**Q15.** Pourquoi les délais d'attente des élections sont-ils aléatoires dans Raft ?

---

### Raft — Réplication de Journal (4 points)

#### Questions à Choix Multiples (4 × 0,5 = 2 points)

**Q16.** Que contient chaque entrée du journal Raft ?

- A) Un horodatage, une signature numérique et une adresse IP
- B) Un index, un numéro de mandat et une commande
- C) Le nom du chef, l'ID du client et un hash
- D) Un compteur de votes, un délai d'attente et un opcode

**Q17.** Que dit la propriété de correspondance du journal (log matching property) ?

- A) Tous les nœuds ont exactement le même journal en permanence
- B) Si deux journaux ont une entrée avec le même index et le même mandat, toutes les entrées précédentes sont identiques
- C) Chaque entrée du journal contient la signature numérique du chef
- D) Le journal ne peut contenir que des entrées du mandat courant

**Q18.** Quand une entrée du journal est-elle considérée comme validée (committed) ?

- A) Quand le chef l'a ajoutée à son journal
- B) Quand tous les suiveurs l'ont reçue et confirmée
- C) Quand la majorité des nœuds l'ont stockée dans leur journal
- D) Quand le client a reçu la réponse du chef

**Q19.** Que fait le chef quand un suiveur a des entrées différentes des siennes ?

- A) Il ignore le suiveur et continue sans lui
- B) Il redémarre le suiveur depuis zéro en vidant son journal
- C) Il recule étape par étape jusqu'à trouver la dernière correspondance, puis écrase les entrées incorrectes
- D) Il demande au client de renvoyer toutes les commandes

#### Question à Réponse Courte (2 points)

**Q20.** Dans un cluster de 5 nœuds, le chef envoie `AppendEntries` à 4 suiveurs. Seulement 2 suiveurs répondent OK (plus le chef lui-même = 3 sur 5). L'entrée est-elle validée ? Pourquoi ?

---

### Raft — En Action (3,5 points)

#### Questions à Choix Multiples (3 × 0,5 = 1,5 points)

**Q21.** Dans un cluster Raft de 5 nœuds, le chef tombe en panne. Comment les suiveurs détectent-ils la panne ?

- A) Le chef envoie un message d'adieu avant de s'éteindre
- B) Les clients les informent que le chef ne répond plus
- C) Leurs délais d'attente expirent — ils ne reçoivent plus de battements de cœur
- D) Un autre nœud diffuse un signal de panne

**Q22.** Un cluster de 5 nœuds subit une partition réseau : 3 nœuds d'un côté, 2 de l'autre. Que peut faire le côté minorité (2 nœuds) ?

- A) Élire un nouveau chef et continuer normalement
- B) Valider des entrées avec une majorité partielle
- C) Se synchroniser avec le côté majorité à travers la partition
- D) Rien — il ne peut pas obtenir la majorité pour élire un chef ou valider des entrées

**Q23.** L'ancien chef (mandat 3) redémarre et envoie un `AppendEntries` au nouveau chef (mandat 4). Que se passe-t-il ?

- A) L'ancien chef reprend son rôle de chef car il était chef avant
- B) L'ancien chef découvre le mandat 4, redescend au rang de suiveur et se synchronise
- C) Les deux nœuds lancent une nouvelle élection pour départager
- D) Le nouveau chef ignore le message car il est occupé

#### Question à Réponse Courte (2 points)

**Q24.** Parmi ces situations, laquelle nécessite un consensus et laquelle n'en a pas besoin ? Justifiez brièvement.

- (a) Une base de données distribuée où tous les nœuds doivent être d'accord sur les données
- (b) Un cache CDN où les nœuds servent des copies de contenu statique
