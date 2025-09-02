// ---------------------------------------------------------------------------
// Fichier : Program.cs
// Description : Point d'entrée du backend Othello AI. 
//               Configure le serveur web, la base de données SQLite, 
//               les endpoints API pour récupérer et mettre à jour les statistiques.
// ---------------------------------------------------------------------------

using Backend.Data;
using OthelloAiBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace OthelloAiBackend
{
    // DTO représentant la requête de mise à jour du Top10 pour une difficulté donnée
    public class StatsUpdateRequest
    {
        public string Difficulty { get; set; } = string.Empty; // Difficulté concernée
        public List<TopScoreDto> Top10 { get; set; } = new List<TopScoreDto>(); // Liste des 10 meilleurs scores
    }

    // DTO représentant un score individuel du Top10
    public class TopScoreDto
    {
        public string Name { get; set; } = string.Empty;    // Nom du joueur
        public int PlayerScore { get; set; }               // Score du joueur
        public int AIScore { get; set; }                   // Score de l'IA
    }

    public class Program
    {
        public static void Main(string[] args)
        {
            // Création du builder pour l'application web
            var builder = WebApplication.CreateBuilder(args);

            // Récupération du port depuis les variables d'environnement ou utilisation du port 3000 par défaut
            var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
            var url = $"http://localhost:{port}";

            // Variable de test pour l'endpoint racine
            var target = Environment.GetEnvironmentVariable("TARGET") ?? "World";

            // Configuration du contexte de base de données SQLite via Entity Framework Core
            builder.Services.AddDbContext<StatsDbContext>(options =>
                options.UseSqlite("Data Source=Data/Stats.db"));

            // Configuration de CORS pour autoriser toutes les origines, headers et méthodes
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            // Construction de l'application web
            var app = builder.Build();


            // Activation de la gestion des fichiers statiques    
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.MapFallbackToFile("index.html");


            // Activation de CORS
            app.UseCors();

            // Endpoint de test rapide pour vérifier que le backend fonctionne
            app.MapGet("/api/test", () => new { message = "Backend OK!" });

            // Endpoint pour récupérer toutes les statistiques et le Top10
            app.MapGet("/api/stats", async (StatsDbContext db) =>
            {
                // Construction de la liste des stats par difficulté
                var statsList = await db.Stats
                    .Select(stat => new
                    {
                        stat.Difficulty,
                        stat.TotalGames,
                        stat.PlayerWinRate,
                        stat.AIWinRate,
                        // Top10 : récupération des 10 meilleurs scores triés par score joueur décroissant
                        Top10 = db.TopScores
                                  .Where(t => t.Difficulty == stat.Difficulty)
                                  .OrderByDescending(t => t.PlayerScore)
                                  .Take(10)
                                  .Select(t => new
                                  {
                                      name = t.PlayerName,
                                      playerScore = t.PlayerScore,
                                      aiScore = t.AIScore
                                  })
                                  .ToList()
                    })
                    .ToListAsync();

                // Renvoi des résultats au client
                return Results.Ok(statsList);
            });

            // Endpoint pour mettre à jour le Top10 d'une difficulté spécifique
            app.MapPost("/api/stats/update", async (StatsUpdateRequest request, StatsDbContext db) =>
            {
                // Validation de la requête : difficulté et Top10 doivent être renseignés
                if (string.IsNullOrEmpty(request.Difficulty) || request.Top10.Count == 0)
                    return Results.BadRequest("Difficulty or Top10 list is missing.");

                // Suppression des anciennes entrées du Top10 pour cette difficulté
                var oldEntries = db.TopScores.Where(t => t.Difficulty == request.Difficulty);
                db.TopScores.RemoveRange(oldEntries);

                // Transformation des DTOs en entités pour l'insertion dans la base
                var newEntries = request.Top10.Select(t => new TopScore
                {
                    Difficulty = request.Difficulty,
                    PlayerName = t.Name,
                    PlayerScore = t.PlayerScore,
                    AIScore = t.AIScore
                }).ToList();

                // Ajout des nouvelles entrées dans la base
                await db.TopScores.AddRangeAsync(newEntries);

                // Sauvegarde des modifications
                await db.SaveChangesAsync();

                // Retour d'un message de succès
                return Results.Ok(new { message = "Top10 updated successfully." });
            });

            // Lancement du serveur sur l'URL configurée
            app.Run(url);
        }
    }
}
