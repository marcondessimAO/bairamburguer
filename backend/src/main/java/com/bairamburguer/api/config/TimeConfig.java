package com.bairamburguer.api.config;

import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class TimeConfig {
    public static final String STORE_TIME_ZONE = "America/Recife";
    public static final ZoneId STORE_ZONE = ZoneId.of(STORE_TIME_ZONE);

    @Bean
    public Clock storeClock() {
        return Clock.system(STORE_ZONE);
    }

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer storeDateTimeJsonCustomizer() {
        return builder -> builder.serializers(new StoreLocalDateTimeSerializer());
    }
}
