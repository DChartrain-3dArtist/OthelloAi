/* =========================================================================
   Fichier : game-ai.service.ts
   Description : Service gérant l'IA du jeu Othello
   - Choix des coups en fonction de la difficulté
   - Implémentation d'une IA Minimax avec élagage alpha-beta
   - Évaluation heuristique des positions
   ========================================================================= */

import { Injectable } from '@angular/core';
import { Board, Player } from './gamelogical.service';

// Niveaux de difficulté disponibles pour l'IA
export type Difficulty = 'Facile' | 'Moyen' | 'Difficile' | 'Expert';

@Injectable({ providedIn: 'root' })
export class GameAIService {

  // Profondeur de recherche pour Minimax selon la difficulté
  private depthByDifficulty: Record<Difficulty, number> = {
    'Facile': 1,
    'Moyen': 2,
    'Difficile': 3,
    'Expert': 5
  };

  // Probabilité de jouer un coup aléatoire selon la difficulté
  private randomnessByDifficulty: Record<Difficulty, number> = {
    'Facile': 0.9,    // 90% aléatoire
    'Moyen': 0.3,     // 30% aléatoire
    'Difficile': 0.08, // 8% aléatoire
    'Expert': 0.0     // 100% déterministe
  };

  /**
   * Choisit un coup pour l'IA selon la difficulté
   */
  chooseMove(
    board: Board,
    player: Player,
    difficulty: Difficulty
  ): { row: number, col: number } | null {

    const moves = this.getValidMoves(board, player);
    if (moves.length === 0) return null;

    const rand = Math.random();
    const randProb = this.randomnessByDifficulty[difficulty] ?? 0.3;
    const depth = this.depthByDifficulty[difficulty] ?? 3;

    // Stratégie selon la difficulté
    switch (difficulty) {
      case 'Facile':
        if (rand < randProb) return this.randomChoice(moves);
        return this.getBestImmediateMove(board, moves, player);

      case 'Moyen':
        if (rand < randProb) return this.randomChoice(moves);
        else {
          if (Math.random() < 0.8) return this.getBestImmediateMove(board, moves, player);
          return this.minimaxDecision(board, player, depth);
        }

      case 'Difficile':
        if (rand < randProb) return this.choiceAmongTopMoves(board, moves, player, 3);
        return this.minimaxDecision(board, player, depth);

      case 'Expert':
      default:
        return this.minimaxDecision(board, player, depth);
    }
  }

  /** Choisit un coup aléatoire parmi les coups valides */
  private randomChoice(moves: { row: number, col: number }[]) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  /** Retourne le coup qui retourne le plus de pions immédiatement */
  private getBestImmediateMove(
    board: Board,
    moves: { row: number, col: number }[],
    player: Player
  ) {
    let best = moves[0];
    let bestFlips = -Infinity;

    for (const m of moves) {
      const flips = this.getFlippableDiscs(board, m.row, m.col, player).length;
      if (flips > bestFlips) {
        bestFlips = flips;
        best = m;
      }
    }
    return best;
  }

  /** Choisit un coup parmi les k meilleurs coups évalués */
  private choiceAmongTopMoves(
    board: Board,
    moves: { row: number, col: number }[],
    player: Player,
    k: number
  ) {
    const evaluated = moves.map(m => {
      const child = this.applyMove(board, m.row, m.col, player);
      return { m, score: this.evaluate(child, player) };
    });

    // Trie les coups du meilleur au pire
    evaluated.sort((a, b) => b.score - a.score);

    // Sélection des top-k coups
    const top = evaluated.slice(0, Math.max(1, Math.min(k, evaluated.length))).map(e => e.m);
    return this.randomChoice(top);
  }

  /** IA Minimax avec élagage alpha-beta pour choisir le meilleur coup */
  private minimaxDecision(board: Board, player: Player, depth: number): { row: number, col: number } | null {
    const moves = this.getValidMoves(board, player);
    if (moves.length === 0) return null;

    let bestScore = -Infinity;
    let bestMove: { row: number, col: number } | null = null;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const m of moves) {
      const child = this.applyMove(board, m.row, m.col, player);
      const score = this.minimax(child, depth - 1, alpha, beta, player, this.opponent(player));
      if (score > bestScore) {
        bestScore = score;
        bestMove = m;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // Élagage
    }
    return bestMove;
  }

  /** Minimax récursif avec élagage alpha-beta */
  private minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    rootPlayer: Player,
    toMove: Player
  ): number {

    if (depth === 0 || this.isTerminal(board)) return this.evaluate(board, rootPlayer);

    const moves = this.getValidMoves(board, toMove);
    if (moves.length === 0) {
      const opp = this.opponent(toMove);
      if (this.getValidMoves(board, opp).length === 0) return this.evaluate(board, rootPlayer);
      return this.minimax(board, depth, alpha, beta, rootPlayer, opp);
    }

    const maximizing = (toMove === rootPlayer);

    if (maximizing) {
      let value = -Infinity;
      for (const m of moves) {
        const child = this.applyMove(board, m.row, m.col, toMove);
        value = Math.max(value, this.minimax(child, depth - 1, alpha, beta, rootPlayer, this.opponent(toMove)));
        alpha = Math.max(alpha, value);
        if (alpha >= beta) break;
      }
      return value;
    } else {
      let value = Infinity;
      for (const m of moves) {
        const child = this.applyMove(board, m.row, m.col, toMove);
        value = Math.min(value, this.minimax(child, depth - 1, alpha, beta, rootPlayer, this.opponent(toMove)));
        beta = Math.min(beta, value);
        if (alpha >= beta) break;
      }
      return value;
    }
  }

  /** Évaluation heuristique d’un plateau pour un joueur */
  private evaluate(board: Board, root: Player): number {
    const opp = this.opponent(root);
    const n = board.length;

    let rootCount = 0, oppCount = 0, empties = 0;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] === root) rootCount++;
        else if (board[r][c] === opp) oppCount++;
        else empties++;
      }
    }

    const pieceDiff = rootCount - oppCount;
    const mobility = this.getValidMoves(board, root).length - this.getValidMoves(board, opp).length;

    // Coins très importants
    const cornerCoords = [[0,0],[0,n-1],[n-1,0],[n-1,n-1]];
    let cornerScore = 0;
    for (const [r,c] of cornerCoords) {
      if (board[r][c] === root) cornerScore += 30;
      else if (board[r][c] === opp) cornerScore -= 30;
    }

    // Bords (moins précieux que les coins)
    let edgeScore = 0;
    for (let i = 1; i < n - 1; i++) {
      [[0,i],[n-1,i],[i,0],[i,n-1]].forEach(([r,c]) => {
        if (board[r][c] === root) edgeScore += 4;
        else if (board[r][c] === opp) edgeScore -= 4;
      });
    }

    // Cases en X (diagonales près des coins), pénalisées
    const xs = [[1,1],[1,n-2],[n-2,1],[n-2,n-2]];
    let xPenalty = 0;
    for (const [r,c] of xs) {
      if (board[r][c] === root) xPenalty -= 8;
      else if (board[r][c] === opp) xPenalty += 8;
    }

    const endgameFactor = empties <= 12 ? 2.0 : 1.0;

    // Score final combinant mobilité, coins, bords, pièces et pénalités
    const score =
      (10 * mobility) +
      (5 * edgeScore) +
      (50 * cornerScore) / 30 +
      (2 * endgameFactor * pieceDiff) +
      (-1 * xPenalty);

    return score;
  }

  /** Vérifie si des coordonnées sont dans le plateau */
  private inBounds(board: Board, x: number, y: number) {
    const n = board.length;
    return x >= 0 && x < n && y >= 0 && y < n;
  }

  /** Renvoie l’adversaire d’un joueur */
  private opponent(p: Player): Player {
    return p === 'player' ? 'ia' : 'player';
  }

  /** Calcule les pions retournables pour un coup sur un plateau donné */
  private getFlippableDiscs(board: Board, row: number, col: number, player: Player): { r: number, c: number }[] {
    if (board[row][col] !== '') return [];
    const opp = this.opponent(player);
    const dirs = [
      [-1,-1],[-1,0],[-1,1],
      [0,-1],       [0,1],
      [1,-1],[1,0],[1,1]
    ];
    const res: { r: number, c: number }[] = [];

    for (const [dx, dy] of dirs) {
      let r = row + dx, c = col + dy;
      const temp: { r: number, c: number }[] = [];
      while (this.inBounds(board, r, c)) {
        if (board[r][c] === opp) temp.push({ r, c });
        else if (board[r][c] === player) { if (temp.length) res.push(...temp); break; }
        else break;
        r += dx; c += dy;
      }
    }
    return res;
  }

  /** Retourne toutes les positions valides pour un joueur sur un plateau donné */
  private getValidMoves(board: Board, player: Player): { row: number, col: number }[] {
    const n = board.length;
    const moves: { row: number, col: number }[] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (board[r][c] === '' && this.getFlippableDiscs(board, r, c, player).length > 0) moves.push({ row: r, col: c });
      }
    }
    return moves;
  }

  /** Retourne un nouveau plateau après avoir appliqué un coup */
  private applyMove(board: Board, row: number, col: number, player: Player): Board {
    const n = board.length;
    const next: Board = board.map(rowArr => rowArr.slice());
    const flips = this.getFlippableDiscs(board, row, col, player);
    for (const f of flips) next[f.r][f.c] = player;
    next[row][col] = player;
    return next;
  }

  /** Vérifie si le plateau est terminal (aucun coup valide pour les deux joueurs) */
  private isTerminal(board: Board): boolean {
    return this.getValidMoves(board, 'player').length === 0 &&
           this.getValidMoves(board, 'ia').length === 0;
  }
}
