# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build

WORKDIR /src
COPY ["DotnetBackend.csproj", "."]
RUN dotnet restore "DotnetBackend.csproj"

COPY . .
RUN dotnet build "DotnetBackend.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "DotnetBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final

# Create non-root user
RUN addgroup -g 1001 -S dotnet && adduser -u 1001 -S dotnet -G dotnet

WORKDIR /app

# Copy published app
COPY --from=publish /app/publish .

# Change ownership
RUN chown -R dotnet:dotnet /app

USER dotnet

EXPOSE 80

ENTRYPOINT ["dotnet", "DotnetBackend.dll"]