/* =========================================================================
   Fichier : gamelogical.service.ts
   Description : Service gérant la logique du jeu Othello
   - Initialisation et gestion du plateau
   - Validation et exécution des coups
   - Calcul des pions retournés et des scores
   - Gestion du joueur courant (player / IA)
   ========================================================================= */

import { Injectable } from '@angular/core';

// Types utilisés pour représenter les joueurs et le plateau
export type Player = 'player' | 'ia' | '';
export type Board = Player[][];

// Interface pour représenter un pion retourné (animation)
export interface FlippedPawn {
  row: number;    // Ligne du pion
  col: number;    // Colonne du pion
  from: Player;   // Valeur avant le flip
  to: Player;     // Valeur après le flip
}

@Injectable({
  providedIn: 'root'
})
export class GameLogicService {
  board: Board = [];                   // Plateau de jeu
  size: number = 8;                    // Taille du plateau (8x8 par défaut)
  currentPlayer: Player = 'player';    // Joueur courant
  private lastFlipped: FlippedPawn[] = []; // Pions retournés lors du dernier coup

  constructor() {
    this.initBoard(); // Initialisation du plateau lors de la création du service
  }

  /**
   * Initialise le plateau avec la taille donnée et les pions de départ
   */
  initBoard(size: number = 8): void {
    this.size = size;
    // Création d'une grille vide
    this.board = Array.from({ length: size }, () => Array(size).fill(''));

    const mid = size / 2;
    // Placement des pions initiaux au centre
    this.board[mid - 1][mid - 1] = 'player';
    this.board[mid][mid] = 'player';
    this.board[mid - 1][mid] = 'ia';
    this.board[mid][mid - 1] = 'ia';

    this.currentPlayer = 'player';
    this.lastFlipped = [];
  }

  /**
   * Vérifie si des coordonnées sont dans le plateau
   */
  private inBounds(x: number, y: number) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  /**
   * Calcule les pions retournables pour un coup donné
   */
  getFlippableDiscs(row: number, col: number, player: Player): { r: number, c: number }[] {
    const opponent: Player = player === 'player' ? 'ia' : 'player';
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    const flippable: { r: number, c: number }[] = [];

    // Parcours de toutes les directions autour du pion
    for (const [dx, dy] of directions) {
      let r = row + dx;
      let c = col + dy;
      const temp: { r: number, c: number }[] = [];

      // Avancer tant qu'on reste dans le plateau
      while (this.inBounds(r, c)) {
        if (this.board[r][c] === opponent) {
          temp.push({ r, c }); // On peut potentiellement retourner ce pion
        } else if (this.board[r][c] === player) {
          flippable.push(...temp); // Capture des pions entre le nouveau et un pion existant
          break;
        } else break; // Case vide => impossible de capturer
        r += dx;
        c += dy;
      }
    }

    return flippable;
  }

  /**
   * Vérifie si un coup est valide pour un joueur
   */
  isValidMove(row: number, col: number, player: Player): boolean {
    if (this.board[row][col] !== '') return false; // Case occupée => invalide
    return this.getFlippableDiscs(row, col, player).length > 0; // Doit retourner au moins un pion
  }

  /**
   * Retourne toutes les positions valides pour un joueur
   */
  getValidMoves(player: Player): { row: number, col: number }[] {
    const moves: { row: number, col: number }[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.isValidMove(r, c, player)) moves.push({ row: r, col: c });
      }
    }
    return moves;
  }

  /**
   * Joue un coup pour le joueur courant
   * - Retourne les pions capturés
   * - Change le joueur courant
   */
  playMove(row: number, col: number): boolean {
    if (!this.isValidMove(row, col, this.currentPlayer)) return false;

    const to: Player = this.currentPlayer;
    const flippedDiscs = this.getFlippableDiscs(row, col, this.currentPlayer);

    // Retour des pions
    for (const f of flippedDiscs) {
      this.board[f.r][f.c] = to;
    }
    this.board[row][col] = to;

    // Stockage pour animation
    this.lastFlipped = flippedDiscs.map(f => ({
      row: f.r,
      col: f.c,
      from: to === 'player' ? 'ia' : 'player',
      to
    }));
    this.lastFlipped.push({ row, col, from: '', to });

    // Passage au joueur suivant
    this.currentPlayer = this.currentPlayer === 'player' ? 'ia' : 'player';
    return true;
  }

  /**
   * Récupère la liste des pions retournés lors du dernier coup
   */
  getFlippedPawns(): FlippedPawn[] {
    const flips = [...this.lastFlipped];
    this.lastFlipped = [];
    return flips;
  }

  /**
   * Calcule les scores actuels pour chaque joueur
   */
  getScores(): { player: number, ia: number } {
    let playerScore = 0, iaScore = 0;
    for (const row of this.board) {
      for (const cell of row) {
        if (cell === 'player') playerScore++;
        else if (cell === 'ia') iaScore++;
      }
    }
    return { player: playerScore, ia: iaScore };
  }
}
