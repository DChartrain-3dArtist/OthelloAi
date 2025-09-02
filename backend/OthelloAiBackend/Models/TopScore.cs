// ---------------------------------------------------------------------------
// Fichier : TopScore.cs
// Description : Modèle représentant une entrée Top10 pour une difficulté
//               donnée, incluant le score du joueur et de l'IA.
// ---------------------------------------------------------------------------

namespace OthelloAiBackend.Models
{
    public class TopScore
    {
        // Identifiant unique pour la table TopScores
        public int Id { get; set; }

        // Difficulté associée à ce score
        public required string Difficulty { get; set; }

        // Nom du joueur ayant obtenu ce score
        public required string PlayerName { get; set; }

        // Score du joueur humain
        public int PlayerScore { get; set; }

        // Score de l'IA pour cette partie
        public int AIScore { get; set; }
    }
}
