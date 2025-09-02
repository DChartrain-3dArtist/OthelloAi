# ---------------------------------------------------------------
# Dockerfile pour OthelloAI
# Backend : .NET 8
# Frontend : Angular compilé dans wwwroot
# Base de données : SQLite
# ---------------------------------------------------------------

# Étape 1 : Image runtime .NET 8
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
EXPOSE 3000

# Étape 2 : Copier tous les fichiers publiés (depuis publish)
COPY . .

# Étape 3 : Vérifier que la base SQLite est incluse
# Ici, le fichier Data/Stats.db doit être présent dans deploy

# Étape 4 : Lancer l'application .NET
ENTRYPOINT ["dotnet", "OthelloAiBackend.dll"]
