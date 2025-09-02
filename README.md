# 🟢 Othello AI Game

Projet personnel combinant **backend en C# .NET**, **frontend Angular/SCSS**, et **intelligence artificielle (algorithme MinMax)** pour le jeu classique **Othello (Reversi)**.

Le projet permet de jouer **Joueur vs IA** , avec suivi des scores, statistiques et Top 10 par difficulté.

---

## 🎯 Objectifs du projet

* Démontrer la maîtrise de **trois compétences complémentaires** :

  * **Backend** : API REST en C# .NET 8, gestion des règles, scores, Top10 et statistiques.
  * **Frontend** : Application Angular 17+ avec SCSS responsive, animations et interface moderne.
  * **IA** : Algorithme **MinMax** côté client pour des parties contre l’ordinateur.
* Fournir un projet **complet et déployable** sur GitHub et en ligne.
* Illustrer la capacité à **intégrer plusieurs technologies** dans un même projet.

---

## 🛠️ Stack technique

* **Frontend** : Angular 17+, SCSS, animations de pions, modals de statistiques et Top10.
* **Backend** : .NET 8, Entity Framework Core, SQLite pour persistance des scores et statistiques.
* **IA** : Algorithme MinMax côté client avec profondeur et randomisation configurables selon la difficulté.
* **Outils & déploiement** : GitHub, Render, Visual Studio / VS Code.

---

## 📂 Structure du projet

```
OthelloAi/
│
├─ backend/                       → Projet .NET (API REST)
│  └─ OthelloAiBackend/
│     ├─ Program.cs               → Configuration API, routes / endpoints
│     ├─ Data/
│     │   └─ StatsDbContext.cs    → DbContext EF Core pour Stats & TopScores
│     └─ Models/
│         ├─ Stat.cs              → Modèle statistiques globales
│         └─ TopScore.cs          → Modèle Top10 pour chaque difficulté
│
├─ frontend/                      → Projet Angular
│  └─ othello-frontend/
│     ├─ app/
│     │   ├─ home/                → Page d'accueil
|     |   ├─ game/                → Page du jeux
|     |   ├─ boardgame/           → Affichage du plateau et Fonctionnaliter de l'UI
│     │   └─ services/            → GameLogic, GameAI, Backend
│     └─ assets/
│
├─ README.md                       → Présentation complète
```

---

## 🏗️ Architecture complète

┌─────────────────────────────┐
│         FRONTEND            │
│       (Angular 17+)         │
│─────────────────────────────│
│ ┌─────────────────────────┐ │
│ │ HomeComponent           │ │
│ │-------------------------│ │
│ │ - Page d'accueil        │ │
│ │ - Présentation projet   │ │
│ │ - Affiche stats globales│ │
│ │ - Redirection vers /game│ │
│ │                         │ │
│ │ ←─────────────┐         │ │
│ │ Stats / Top10 │         │ │
│ └───────────────┘─────────  │
│         │                  │
│         ▼                  │
│ ┌─────────────────────────┐ │
│ │ GameComponent           │ │
│ │-------------------------│ │
│ │ - Page /game             │ │
│ │ - Conteneur global du jeu│ │
│ │ - Panels / Scores / Modals││
│ │ - Reçoit events du plateau││
│ │                         │ │
│ │ ←─────────────┐         │ │
│ │ Stats / Top10 │         │ │
│ │ (BackendService)        │ │
│ └───────────────┘         │
│         │                  │
│         ▼ contient         │
│ ┌─────────────────────────┐ │
│ │ BoardGameComponent      │ │
│ │-------------------------│ │
│ │ - Plateau 8x8            │ │
│ │ - UI & animations pions  │ │
│ │ - Gère clics joueur      │ │
│ │ - Change tour / score    │ │
│ │                          │ │
│ │ Communique avec :        │ │
│ │  ┌───────────────────┐   │ │
│ │  │ GameLogicService   │  │ │
│ │  │------------------ │   │ │
│ │  │ - Initialisation    │ │
│ │  │ - Validation coups  │ │
│ │  │ - Calcul flips      │ │
│ │  │ - Score / tour      │ │
│ │  └───────────────────┘  │ │
│ │                         │ │
│ │  ┌───────────────────┐  │ │
│ │  │ GameAIService      │ │ │
│ │  │------------------ │  │ │
│ │  │ - Choix coup IA      │ │
│ │  │ - MinMax / AlphaBeta │ │
│ │  │ - Évaluation coups   │ │
│ │  └───────────────────┘  │ │
│ │                         │ │
│ │ Émet vers GameComponent │ │
│ │ - Events: score, tour,  │ │
│ │   fin de partie         │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ BackendService          │ │
│ │-------------------------│ │
│ │ - Communication unique  │ │
│ │   avec le backend       │ │
│ │ - GET /api/stats        │ │
│ │ - POST /api/stats/update│ │
│ │ - Stocke et trie stats  │ │
│ │ - Observable statsLoaded$ ││
│ └─────────────────────────┘ │
└─────────────▲──────────────┘
              │ HTTP REST / JSON
              │
┌─────────────┴───────────────┐
│          BACKEND            │
│         (.NET 8 / API)      │
│─────────────────────────────│
│ DbContext : StatsDbContext  │
│ - Tables : Stats, TopScores │
│ Models :                    │
│ - Stat : difficulty, totalGames, winRate│
│ - TopScore : difficulty, playerScore, aiScore│
│ API Endpoints :             │
│ ┌─────────────────────────┐  │
│ │ GET /api/stats          │<─┘ Reçoit stats globales
│ │ - Récupère stats & Top10│
│ └─────────────────────────┘
│ ┌─────────────────────────┐
│ │ POST /api/stats/update  │<─┘ Reçoit Top10 mis à jour
│ │ - Met à jour TopScores  │
│ └─────────────────────────┘
└─────────────────────────────┘

**Explication du flux complet** :

**HomeComponent** : affiche des statistiques globales depuis le BackendService. Redirige vers GameComponent.
**GameComponent** : contient le plateau et l’interface de jeu. Récupère les stats via BackendService et envoie le Top10 à la fin d’une partie.
**BoardGameComponent** : gère le plateau, les clics et animations. Communique avec GameLogicService pour la logique et avec GameAIService pour les coups de l’IA.
**BackendService** : unique point de contact avec le backend, pour récupérer et mettre à jour les statistiques.
**GameLogicService** : logique complète du jeu côté frontend, aucune communication backend.
**GameAIService** : calcul du coup optimal via MinMax/AlphaBeta côté frontend, aucune communication backend.
**Backend (.NET 8)** : expose les endpoints REST pour stats et Top10, stocke les données dans SQLite via EF Core (StatsDbContext).

---

* **Frontend ↔ Backend** : Le frontend Angular récupère et met à jour les statistiques via l’API REST.
* **IA côté frontend** : Le calcul MinMax se fait localement pour réduire la charge sur le backend.
* **Base de données** : SQLite pour stocker les statistiques et le Top10 par difficulté.

---

## 🚀 Installation et lancement

### 1. Cloner le projet

```bash
git clone https://github.com/<ton-user>/OthelloAi.git
cd OthelloAi
```

### 2. Backend (.NET)

```bash
cd backend/OthelloAiBackend
dotnet restore
dotnet run
```

* API disponible sur `http://localhost:3000`.
* Endpoints principaux :

  * `GET /api/stats` → récupère les stats et Top10.
  * `POST /api/stats/update` → met à jour le Top10 pour une difficulté donnée.

### 3. Frontend (Angular)

```bash
cd frontend/othello-frontend
npm install
npm start
```

* Application disponible sur `http://localhost:4200`.
* Communication directe avec le backend pour stats, Top10 et scores.

---

## 🧠 IA (MinMax)

* Évaluations basées sur :

  * **Différence de pions** (`pieceDiff`)
  * **Mobilité** (nombre de coups valides)
  * **Coins et bords** pour maximiser le contrôle stratégique
  * **Cases "X" pénalisantes**
* Profondeur et randomisation ajustables selon la difficulté : Facile, Moyen, Difficile, Expert.
* IA légère, calculée **côté frontend**, pour une expérience réactive.

---

## 📱 Compatibilité et UX

* Interface **responsive** : mobile et desktop.
* Interaction tactile ou souris pour sélectionner les cases.
* Animation fluide des pions retournés.
* Statistiques visibles en temps réel : nombre de parties, taux de victoires, Top10.

---

## 📌 Roadmap

* [x] Initialisation du repo backend + frontend
* [x] Implémentation règles Othello côté backend
* [x] Création interface plateau Angular
* [x] IA MinMax côté frontend
* [x] Amélioration UX (animations, effets visuels)
* [x] Déploiement : Render

---

## 📜 Licence

* Projet personnel sous licence **MIT**
* Libre d’utilisation et de modification

✨ Développé par **Chartrain Donovan** – démonstration .NET, Angular et IA

