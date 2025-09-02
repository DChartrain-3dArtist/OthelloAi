/* =========================================================================
   Fichier : backend.service.ts
   Description : Service Angular pour communiquer avec le backend
   - Récupération des statistiques globales (parties jouées, taux de victoire)
   - Gestion du Top 10 pour chaque difficulté
   ========================================================================= */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

/** Interface représentant un score dans le Top 10 */
export interface TopScore {
  name: string;         // Nom du joueur
  playerScore: number;  // Score du joueur
  aiScore: number;      // Score de l'IA
}

/** Interface représentant les statistiques pour une difficulté */
export interface Stats {
  totalGames: number;       // Nombre total de parties jouées
  playerWinRate: number;    // Pourcentage de victoires du joueur
  aiWinRate: number;        // Pourcentage de victoires de l'IA
  top10: TopScore[];        // Liste des 10 meilleurs scores
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  /** Stockage interne de toutes les statistiques par difficulté */
  private allStats: Record<string, Stats> = {};

  /** Observable pour notifier quand les stats sont chargées */
  private statsLoadedSubject = new BehaviorSubject<boolean>(false);
  statsLoaded$ = this.statsLoadedSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les statistiques depuis le backend
   * et les stocke dans `allStats`.
   * Notifie via `statsLoaded$` une fois le chargement terminé.
   */
  fetchAllStats(): void {
    this.http.get<any[]>('/api/stats').subscribe({
      next: (data) => {
        data.forEach(item => {
          this.allStats[item.difficulty] = {
            totalGames: item.totalGames,
            playerWinRate: item.playerWinRate,
            aiWinRate: item.aiWinRate,
            top10: item.top10
          };
        });
        // Notifie que les statistiques sont prêtes
        this.statsLoadedSubject.next(true);
      },
      error: (err) => {
        console.error('Erreur récupération stats :', err);
        this.statsLoadedSubject.next(false);
      }
    });
  }

  /**
   * Récupère les statistiques pour une difficulté spécifique
   * @param difficulty Nom de la difficulté (ex: "Facile", "Moyen")
   * @returns Les stats correspondantes ou `undefined` si non trouvées
   */
  getStatsByDifficulty(difficulty: string): Stats | undefined {
    return this.allStats[difficulty];
  }

  /**
   * Met à jour le Top 10 pour une difficulté donnée
   * @param difficulty Nom de la difficulté
   * @param top10 Liste des 10 meilleurs scores
   * @returns Observable de la réponse du backend
   */
  updateTop10(difficulty: string, top10: TopScore[]): Observable<any> {
    return this.http.post('/api/stats/update', { difficulty, top10 });
  }
}
