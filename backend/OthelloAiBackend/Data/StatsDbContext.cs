// ---------------------------------------------------------------------------
// Fichier : StatsDbContext.cs
// Description : Contexte de base de données pour l'application Othello AI.
//               Gère les entités Stat et TopScore via Entity Framework Core
//               et configure les tables correspondantes dans SQLite.
// ---------------------------------------------------------------------------

using Microsoft.EntityFrameworkCore;
using OthelloAiBackend.Models;

namespace Backend.Data
{
    public class StatsDbContext : DbContext
    {
        // Constructeur du contexte, reçoit les options de configuration (connexion SQLite, etc.)
        public StatsDbContext(DbContextOptions<StatsDbContext> options) : base(options) { }

        // Table des statistiques globales par difficulté
        public DbSet<Stat> Stats { get; set; }

        // Table des Top10 pour chaque difficulté
        public DbSet<TopScore> TopScores { get; set; }

        // Configuration des entités et des tables associées
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Appel de la configuration de base
            base.OnModelCreating(modelBuilder);

            // Association de l'entité Stat à la table "Stats"
            modelBuilder.Entity<Stat>().ToTable("Stats");

            // Association de l'entité TopScore à la table "TopScores"
            modelBuilder.Entity<TopScore>().ToTable("TopScores");
        }
    }
}
