package com.bairamburguer.api.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Habilita o prefixo /topic para broadcast (onde os alertas serão publicados)
        config.enableSimpleBroker("/topic");
        // Prefixo para mensagens enviadas pelo cliente ao servidor (se houver no futuro)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Regista o endpoint /api/ws e permite conexões do Next.js
        registry.addEndpoint("/api/ws")
                .setAllowedOrigins("http://localhost:3000", "https://bairamburguer.vercel.app", "https://bairamburguerpetiscaria.com", "https://www.bairamburguerpetiscaria.com")
                .withSockJS();
    }
}
