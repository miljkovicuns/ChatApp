package com.ftn.sr192024.messenger.config;

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
        config.enableSimpleBroker("/topic", "/queue", "/user");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // ✅ Register the endpoint with SockJS
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:4200")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // ✅ Also register without SockJS for native WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:4200")
                .setAllowedOriginPatterns("*");
    }
}
