/**
 * ------------------------------------------------------------
 * Fichier : home.component.ts
 * Composant Angular représentant la page d'accueil du jeu Othello.
 * - Gère l'affichage des animations d'entrée.
 * - Permet de lancer une partie avec une difficulté choisie.
 * - Affiche les statistiques (taux de victoire, parties jouées, top 10).
 * ------------------------------------------------------------
 */

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, animate, transition, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackendService, Stats, TopScore } from '../services/backend.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [
    // Animation simple pour faire apparaître un élément avec une transition verticale
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    // Animation en cascade pour les cartes et les boutons d'action
    trigger('fadeUpStagger', [
      transition(':enter', [
        query('.card, .cta-buttons > *', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(150, [
            animate('0.8s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    // Animation d'apparition/disparition du panneau de statistiques
    trigger('fadeInScale', [
      state('hidden', style({ opacity: 0, transform: 'scaleY(0)' })),
      state('visible', style({ opacity: 1, transform: 'scaleY(1)' })),
      transition('hidden => visible', animate('400ms ease-out')),
      transition('visible => hidden', animate('300ms ease-in'))
    ])
  ]
})
export class HomeComponent implements OnInit {

  /** Indique si le panneau des statistiques est affiché */
  showStats = false;

  /** Liste des niveaux de difficulté disponibles pour commencer une partie */
  difficulties = ['Facile', 'Moyen', 'Difficile', 'Expert'];

  /** Difficulté actuellement sélectionnée (par défaut : Facile) */
  selectedDifficulty = this.difficulties[0];

  /** Statistiques générales (récupérées depuis le backend) */
  totalGames = 0;
  playerWinRate = 0;
  aiWinRate = 0;

  /** Top 10 des meilleurs scores pour la difficulté sélectionnée */
  top10: TopScore[] = [];

  constructor(
    private router: Router,
    private backend: BackendService
  ) {}

  /**
   * Cycle de vie Angular : appelé lors de l'initialisation du composant.
   * - Récupère les statistiques globales depuis le backend.
   * - Met à jour les données une fois chargées.
   */
  ngOnInit(): void {
    this.backend.fetchAllStats();

    this.backend.statsLoaded$.subscribe(loaded => {
      if (loaded) this.updateStats();
    });
  }

  /**
   * Bascule l'affichage du panneau de statistiques.
   */
  toggleStatsPanel(): void {
    this.showStats = !this.showStats;
  }

  /**
   * Lance une nouvelle partie en redirigeant vers la page de jeu.
   */
  onStartGame(): void {
    this.router.navigate(['/game']);
  }

  /**
   * Ouvre le portfolio de l'auteur dans un nouvel onglet.
   */
  onShowPortfolio(): void {
    window.open('https://donovan-dev3d.vercel.app', '_blank');
  }

  /**
   * Met à jour les statistiques affichées en fonction de la difficulté sélectionnée.
   */
  updateStats(): void {
    const stats: Stats | undefined = this.backend.getStatsByDifficulty(this.selectedDifficulty);
    if (stats) {
      this.totalGames = stats.totalGames;
      this.playerWinRate = stats.playerWinRate;
      this.aiWinRate = stats.aiWinRate;
      this.top10 = stats.top10;
    }
  }
}
