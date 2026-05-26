# Estágio 1: Build (Compilação com Maven)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Baixar as dependências do maven (cache layer)
RUN mvn dependency:go-offline
COPY src ./src
# Fazer o build do projeto e ignorar testes
RUN mvn clean package -DskipTests

# Estágio 2: Run (Apenas JRE para produção)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copiar o JAR gerado no primeiro estágio
COPY --from=build /app/target/*.jar app.jar
# Expor a porta 8080
EXPOSE 8080
# Comando de inicialização
ENTRYPOINT ["java", "-jar", "app.jar"]
