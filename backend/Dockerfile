# Imagem base open-source do Eclipse Temurin (Java 21)
FROM eclipse-temurin:21-jdk-alpine

# Diretório temporário
VOLUME /tmp

# Copia o JAR compilado pelo Maven
COPY target/*.jar app.jar

# Expõe a porta do Spring Boot
EXPOSE 8080

# Comando de inicialização usando apenas o OpenJDK
ENTRYPOINT ["java", "-jar", "/app.jar"]
