# Bairamburguer API

Esta é a API do sistema Bairamburguer, desenvolvida em Java 21 com Spring Boot.

## Requisito Crítico: OpenJDK

> **ATENÇÃO:** Para evitar custos de licenciamento comercial da Oracle, este projeto **deve** ser desenvolvido e executado utilizando distribuições OpenJDK.
Recomendamos fortemente a instalação do **Eclipse Temurin** (Java 21).

- [Download do Eclipse Temurin (Adoptium)](https://adoptium.net/)

## Executando localmente

1. Certifique-se de ter o PostgreSQL rodando localmente na porta `5432` com o banco de dados `bairamburguer`.
2. Execute o projeto localmente com o Maven:
   ```bash
   mvn spring-boot:run
   ```

## Docker

Para construir e rodar a imagem Docker baseada no Eclipse Temurin:

```bash
mvn clean package -DskipTests
docker build -t bairamburguer-api .
docker run -p 8080:8080 bairamburguer-api
```
