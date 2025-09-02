/* ==========================================================================
   Fichier : game.component.ts
   Description :
   Composant principal de la partie (logique de jeu).
   - Gestion des difficultés et de la configuration associée
   - Suivi du score joueur / IA et des coups valides
   - Détection de la fin de partie et affichage du panneau de résultats
   - Gestion des statistiques (taux de victoire, top 10, etc.)
   - Intégration avec le BackendService et BoardGameComponent
   - Animations d’affichage
========================================================================== */

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BackendService, Stats, TopScore } from '../services/backend.service';
import { BoardGameComponent } from '../boardgame/boardgame.component';
import { trigger, transition, style, animate } from '@angular/animations';

/* ------------------------------
   Définition du type de difficulté
------------------------------ */
type Difficulty = 'Facile' | 'Moyen' | 'Difficile' | 'Expert';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FormsModule, BoardGameComponent],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
  animations: [
    // Animation de fondu avec translation latérale
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateX(-20px)' })),
      ]),
    ]),
  ]
})
export class GameComponent implements OnInit {
  /* ------------------------------
     Référence au plateau de jeu
  ------------------------------ */
  @ViewChild('boardGame') boardGame!: BoardGameComponent;

  /* ------------------------------
     Configuration des difficultés
  ------------------------------ */
  difficulties: Difficulty[] = ['Facile', 'Moyen', 'Difficile', 'Expert'];
  selectedDifficulty: Difficulty = 'Facile';

  // Couleurs et icônes associées à chaque difficulté
  difficultyConfig: Record<Difficulty, { color: string; icon: string }> = {
    'Facile': { color: '#10B981', icon: '★' },
    'Moyen': { color: '#FACC15', icon: '★★' },
    'Difficile': { color: '#F97316', icon: '★★★' },
    'Expert': { color: '#EF4444', icon: '★★★★' }
  };

  /* ------------------------------
     Statistiques globales
  ------------------------------ */
  totalGames = 0;
  playerWinRate = 0;
  aiWinRate = 0;
  top10: TopScore[] = [];

  /* ------------------------------
     État de la partie en cours
  ------------------------------ */
  currentTurn: 'Joueur' | 'IA' = 'Joueur';
  playerScore = 0;
  aiScore = 0;
  validMovesCount = 0;
  aiThinking = false;

  /* ------------------------------
     Gestion de la fin de partie
  ------------------------------ */
  showEndgame = false;
  endgameMessage = '';
  endgameClass = '';
  endgamePanel: 'top10' | 'difficulty' = 'top10';

  /* ------------------------------
     Gestion du Top 10
  ------------------------------ */
  top10NameError = '';
  top10PlayerName = '';
  showTop10EntryPanel = false;
  submittingTop10 = false;

  /* ------------------------------
     Panneaux et modales
  ------------------------------ */
  showStats = false;
  showDifficultyModal = false;

  constructor(private router: Router, private backend: BackendService) {}

  /* ------------------------------
     Cycle de vie Angular
     Chargement des stats au démarrage
  ------------------------------ */
  ngOnInit() {
    this.backend.fetchAllStats();
    this.backend.statsLoaded$.subscribe(loaded => {
      if (loaded) this.updateStats();
    });
  }

  /* ------------------------------
     Navigation et panneaux
  ------------------------------ */
  goHome() { this.router.navigate(['/']); }
  toggleStatsPanel() { this.showStats = !this.showStats; }

  /* ------------------------------
     Gestion des stats selon difficulté
  ------------------------------ */
  getDifficultyConfig(diff: Difficulty) {
    return this.difficultyConfig[diff];
  }

  updateStats() {
    const stats: Stats | undefined = this.backend.getStatsByDifficulty(this.selectedDifficulty);
    if (stats) {
      this.totalGames = stats.totalGames;
      this.playerWinRate = stats.playerWinRate;
      this.aiWinRate = stats.aiWinRate;
      this.top10 = stats.top10;
    }
  }

  /* ------------------------------
     Démarrage d’une nouvelle partie
  ------------------------------ */
  newGame(): void {
    this.boardGame?.initGame();
    this.playerScore = 0;
    this.aiScore = 0;
    this.validMovesCount = this.boardGame?.validMoves.length || 0;
    this.currentTurn = 'Joueur';
    this.showEndgame = false;
    this.showTop10EntryPanel = false;
  }

  /* ------------------------------
     Gestion des difficultés
  ------------------------------ */
  toggleDifficultyModal(): void {
    this.showDifficultyModal = !this.showDifficultyModal;
  }

  changeDifficulty(diff: Difficulty, fromEndgame: boolean = false): void {
    this.selectedDifficulty = diff;
    this.updateStats();
    this.newGame();
    this.showDifficultyModal = false;

    if (fromEndgame) {
      this.endgamePanel = 'top10';
    }
  }

  openEndgameDifficultyPanel() {
    this.endgamePanel = this.endgamePanel === 'top10' ? 'difficulty' : 'top10';
  }

  /* ------------------------------
     Gestion des tours de jeu
  ------------------------------ */
  passTurn(): void {
    if (this.currentTurn === 'Joueur' && this.validMovesCount === 0) {
      this.boardGame.passTurn();
    }
  }

  /* ------------------------------
     Mise à jour du score en cours
     + Détection de fin de partie
  ------------------------------ */
  updateScores(event: { player: number; ia: number; validMovesCount: number }) {
    this.playerScore = event.player;
    this.aiScore = event.ia;
    this.validMovesCount = event.validMovesCount;

    const iaMoves = this.boardGame?.getValidMovesFor('ia').length || 0;

    // Condition de fin de partie : plus aucun coup valide
    if (this.validMovesCount === 0 && iaMoves === 0) {
      this.showEndgame = true;
      if (this.playerScore > this.aiScore) {
        this.endgameMessage = 'Victoire du Joueur 🎉';
        this.endgameClass = 'victory';
      } else if (this.playerScore < this.aiScore) {
        this.endgameMessage = 'Victoire de l’IA 🤖';
        this.endgameClass = 'defeat';
      } else {
        this.endgameMessage = 'Match nul ⚖️';
        this.endgameClass = 'draw';
      }

      this.updateStats();

      // Vérifie si le joueur peut entrer dans le top 10
      if (this.playerScore > this.aiScore) this.checkTop10Eligibility();
    }
  }

  /* ------------------------------
     Gestion du Top 10
  ------------------------------ */
  getTop10Score(): number {
    return this.playerScore - this.aiScore;
  }

  checkTop10Eligibility() {
    const stats = this.backend.getStatsByDifficulty(this.selectedDifficulty);
    if (!stats) return;

    const playerTopScore = this.getTop10Score();
    const lowestTopScore = stats.top10.length === 10
      ? stats.top10[9].playerScore - stats.top10[9].aiScore
      : -Infinity;

    if (playerTopScore > lowestTopScore) {
      this.top10PlayerName = `Player-${Math.floor(Math.random() * 1000)}`;
      this.showTop10EntryPanel = true;
    }
  }

  submitTop10Name() {
    if (!this.top10PlayerName) return;

    // Vérification du format du pseudo
    const nameRegex = /^[a-zA-Z0-9-]{4,20}$/;
    if (!nameRegex.test(this.top10PlayerName)) {
      this.top10NameError = 'Pseudo invalide. 4 à 20 caractères alphanumériques et "-" uniquement.';
      return;
    }

    this.top10NameError = '';
    this.submittingTop10 = true;

    const stats = this.backend.getStatsByDifficulty(this.selectedDifficulty);
    if (!stats) return;

    const newScore = this.playerScore - this.aiScore;

    // Si un score identique existe déjà → remplacement
    const indexToReplace = stats.top10.findIndex(
      entry => (entry.playerScore - entry.aiScore) === newScore
    );

    if (indexToReplace >= 0) {
      stats.top10[indexToReplace] = {
        name: this.top10PlayerName,
        playerScore: this.playerScore,
        aiScore: this.aiScore
      };
    } else {
      // Sinon ajout et tri du tableau
      stats.top10.push({
        name: this.top10PlayerName,
        playerScore: this.playerScore,
        aiScore: this.aiScore
      });
      stats.top10.sort((a, b) => (b.playerScore - b.aiScore) - (a.playerScore - a.aiScore));
      if (stats.top10.length > 10) stats.top10.pop();
    }

    // Mise à jour backend + refresh local
    this.backend.updateTop10(this.selectedDifficulty, stats.top10).subscribe({
      next: () => {
        this.top10 = [...stats.top10];
        this.showTop10EntryPanel = false;
        this.submittingTop10 = false;
        this.endgamePanel = 'top10';
      },
      error: () => { this.submittingTop10 = false; }
    });
  }

  /* ------------------------------
     Fonctions utilitaires
  ------------------------------ */
  forceEndgame() {
    if (this.playerScore > this.aiScore) {
      this.endgameMessage = 'Vous avez gagné !';
      this.endgameClass = 'victory';
    } else if (this.playerScore < this.aiScore) {
      this.endgameMessage = 'L\'IA a gagné !';
      this.endgameClass = 'defeat';
    } else {
      this.endgameMessage = 'Égalité !';
      this.endgameClass = 'draw';
    }
    this.showEndgame = true;
  }

  testTop10EntryPanel() {
    this.playerScore = 30;
    this.aiScore = 20;
    this.showEndgame = true;
    this.showTop10EntryPanel = true;
    this.top10PlayerName = `Player-${Math.floor(Math.random() * 1000)}`;
  }

  // Transforme l’affichage du panneau selon l’onglet actif
  get panelTransform(): string {
    return this.endgamePanel === 'top10' ? 'translateX(0)' : 'translateX(-100%)';
  }
}
