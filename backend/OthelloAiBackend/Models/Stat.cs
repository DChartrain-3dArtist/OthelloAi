// ---------------------------------------------------------------------------
// Fichier : Stat.cs
// Description : Modèle représentant les statistiques globales d'une difficulté
//               dans le jeu Othello AI.
// ---------------------------------------------------------------------------

namespace OthelloAiBackend.Models
{
    public class Stat
    {
        // Identifiant unique pour la table Stats
        public int Id { get; set; }

        // Difficulté associée à ces statistiques (Facile, Moyen, Difficile, Expert)
        public required string Difficulty { get; set; }

        // Nombre total de parties jouées pour cette difficulté
        public int TotalGames { get; set; }

        // Pourcentage de victoires du joueur humain
        public int PlayerWinRate { get; set; }

        // Pourcentage de victoires de l'IA
        public int AIWinRate { get; set; }
    }
}
