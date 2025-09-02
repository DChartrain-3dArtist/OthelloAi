// =========================================================================
// Fichier : boardgame.component.ts
// Description : Composant Angular gérant le plateau de jeu Othello
// - Affichage et logique des pions
// - Gestion des coups du joueur et de l'IA
// - Animation des pions qui se retournent
// - Emission d'événements vers le parent pour scores et tour actuel
// =========================================================================

import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameLogicService, Player, FlippedPawn } from '../services/gamelogical.service';
import { GameAIService, Difficulty } from '../services/game-ai.service';

// Interface pour gérer les animations des pions retournés
interface AnimatedPawn {
  id: string;             // Identifiant unique du pion (ligne-colonne)
  pawn: FlippedPawn;      // Objet contenant row, col, from, to
  animating: boolean;     // Indique si le pion est en animation
}

@Component({
  selector: 'app-boardgame',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './boardgame.component.html',
  styleUrls: ['./boardgame.component.scss']
})
export class BoardGameComponent implements OnInit {

  // -------------------------
  // Inputs
  // -------------------------
  @Input() size: number = 8;              // Taille du plateau
  @Input() difficulty: Difficulty = 'Moyen'; // Difficulté de l'IA

  // -------------------------
  // Outputs vers le parent
  // -------------------------
  @Output() playerTurnChange = new EventEmitter<'Joueur' | 'IA'>(); 
  @Output() scoreChange = new EventEmitter<{ player: number, ia: number, validMovesCount: number }>();
  @Output() aiThinkingChange = new EventEmitter<boolean>();

  // -------------------------
  // Etat interne
  // -------------------------
  board: Player[][] = [];                   // Plateau actuel
  currentPlayer: Player = 'player';        // Joueur courant ('player' ou 'ia')
  validMoves: { row: number, col: number }[] = []; // Coups valides pour currentPlayer
  flippingPawns: AnimatedPawn[] = [];      // Pions actuellement en animation

  private aiThinking = false;             // Indicateur si l'IA réfléchit

  constructor(
    private gameLogic: GameLogicService,
    private ai: GameAIService
  ) {}

  // -------------------------
  // Initialisation du composant
  // -------------------------
  ngOnInit(): void {
    this.initGame(); // Initialise le plateau et les scores
  }

  // -------------------------
  // Initialise une nouvelle partie
  // -------------------------
  initGame(): void {
    this.gameLogic.initBoard(this.size); // Initialise la logique du plateau
    this.board = this.gameLogic.board.map(row => [...row]); // Copie du plateau
    this.currentPlayer = this.gameLogic.currentPlayer; // Premier joueur
    this.validMoves = this.gameLogic.getValidMoves(this.currentPlayer);
    this.flippingPawns = [];
    this.emitState(); // Notifie le parent du nouvel état

    // Si l'IA commence, lance son coup après un petit délai
    if (this.currentPlayer === 'ia') {
      setTimeout(() => this.playAIMove(), 300);
    }
  }

  // -------------------------
  // Gestion du clic sur une case
  // -------------------------
  handleClick(row: number, col: number) {
    if (this.currentPlayer !== 'player') return; // Ignorer si ce n'est pas le joueur
    if (!this.isValidMove(row, col)) return;    // Ignorer si le coup n'est pas valide

    // Préparer les pions qui vont se retourner pour l'animation
    const flippedBefore: AnimatedPawn[] = this.gameLogic
      .getFlippableDiscs(row, col, this.currentPlayer)
      .map(p => ({
        id: `${p.r}-${p.c}`,
        pawn: { row: p.r, col: p.c, from: this.board[p.r][p.c], to: this.currentPlayer },
        animating: true
      }));

    // Ajouter le pion joué
    flippedBefore.push({
      id: `${row}-${col}`,
      pawn: { row, col, from: '', to: this.currentPlayer },
      animating: true
    });

    this.flippingPawns = flippedBefore;

    // Jouer le coup dans la logique
    const moved = this.gameLogic.playMove(row, col);
    if (!moved) return;

    // Appliquer l'animation avant de mettre à jour le plateau
    setTimeout(() => {
      for (const p of this.flippingPawns) {
        this.board[p.pawn.row][p.pawn.col] = p.pawn.to;
      }
      this.flippingPawns = [];
      this.currentPlayer = this.gameLogic.currentPlayer;
      this.validMoves = this.gameLogic.getValidMoves(this.currentPlayer);
      this.emitState();

      // Si c'est au tour de l'IA, elle joue après un court délai
      if (this.currentPlayer === 'ia') {
        setTimeout(() => this.playAIMove(), 350);
      }
    }, 600);
  }

  // -------------------------
  // Passer son tour si aucun coup valide
  // -------------------------
  passTurn(): void {
    if (this.currentPlayer !== 'player') return;
    if (this.validMoves.length > 0) return;

    this.gameLogic.currentPlayer = 'ia';
    this.currentPlayer = 'ia';
    this.validMoves = this.gameLogic.getValidMoves(this.currentPlayer);
    this.emitState();

    setTimeout(() => this.playAIMove(), 300);
  }

  // -------------------------
  // Obtenir les coups valides pour un joueur
  // -------------------------
  getValidMovesFor(player: Player): { row: number, col: number }[] {
    return this.gameLogic.getValidMoves(player);
  }

  // -------------------------
  // L'IA joue un coup
  // -------------------------
  private playAIMove() {
    this.aiThinking = true;
    this.aiThinkingChange.emit(true);

    setTimeout(() => {
      const best = this.ai.chooseMove(this.board, 'ia', this.difficulty);

      // Si l'IA ne peut pas jouer, passer au joueur
      if (!best) {
        this.gameLogic.currentPlayer = 'player';
        this.currentPlayer = 'player';
        this.validMoves = this.gameLogic.getValidMoves(this.currentPlayer);
        this.emitState();
        this.aiThinking = false;
        this.aiThinkingChange.emit(false);
        return;
      }

      const { row, col } = best;

      // Préparer les animations des pions retournés
      const flips = this.gameLogic.getFlippableDiscs(row, col, 'ia');
      const flippedBefore: AnimatedPawn[] = flips.map(p => ({
        id: `${p.r}-${p.c}`,
        pawn: { row: p.r, col: p.c, from: this.board[p.r][p.c], to: 'ia' as Player },
        animating: true
      }));
      flippedBefore.push({
        id: `${row}-${col}`,
        pawn: { row, col, from: '', to: 'ia' },
        animating: true
      });
      this.flippingPawns = flippedBefore;

      const moved = this.gameLogic.playMove(row, col);
      if (!moved) {
        this.board = this.gameLogic.board.map(r => [...r]);
        this.currentPlayer = this.gameLogic.currentPlayer;
        this.validMoves = this.gameLogic.getValidMoves(this.currentPlayer);
        this.emitState();
        this.aiThinking = false;
        this.aiThinkingChange.emit(false);
        return;
      }

      // Appliquer les animations avant de mettre à jour le plateau
      setTimeout(() => {
        for (const p of this.flippingPawns) {
          this.board[p.pawn.row][p.pawn.col] = p.pawn.to;
        }
        this.flippingPawns = [];
        this.currentPlayer = this.gameLogic.currentPlayer;
        this.validMoves = this.gameLogic.getValidMoves(this.currentPlayer);
        this.emitState();

        this.aiThinking = false;
        this.aiThinkingChange.emit(false);

        // Si l'IA peut rejouer immédiatement
        if (this.currentPlayer === 'ia' && this.validMoves.length > 0) {
          setTimeout(() => this.playAIMove(), 350);
        }
      }, 600);
    }, 300);
  }

  // -------------------------
  // Vérifie si une case est en animation
  // -------------------------
  isFlipping(row: number, col: number) {
    return this.flippingPawns.some(f => f.id === `${row}-${col}` && f.animating);
  }

  // -------------------------
  // Vérifie si un coup est valide
  // -------------------------
  isValidMove(row: number, col: number): boolean {
    return this.validMoves.some(m => m.row === row && m.col === col);
  }

  // -------------------------
  // Obtenir la valeur "from" d'une case (avant animation)
  // -------------------------
  getFromCell(row: number, col: number): Player {
    const f = this.flippingPawns.find(p => p.pawn.row === row && p.pawn.col === col);
    return f ? f.pawn.from : this.board[row][col];
  }

  // -------------------------
  // Obtenir la valeur "to" d'une case (après animation)
  // -------------------------
  getToCell(row: number, col: number): Player {
    const f = this.flippingPawns.find(p => p.pawn.row === row && p.pawn.col === col);
    return f ? f.pawn.to : this.board[row][col];
  }

  // -------------------------
  // Émet l'état courant vers le parent
  // - Tour actuel
  // - Scores joueurs
  // - Nombre de coups valides
  // -------------------------
  private emitState(): void {
    this.playerTurnChange.emit(this.currentPlayer === 'player' ? 'Joueur' : 'IA');
    const scores = this.gameLogic.getScores();
    this.scoreChange.emit({ ...scores, validMovesCount: this.validMoves.length });
  }
}
