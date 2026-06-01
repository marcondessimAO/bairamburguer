package com.bairamburguer.api.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class StartupVersionLogger {
    private static final Logger log = LoggerFactory.getLogger(StartupVersionLogger.class);

    @EventListener(ApplicationReadyEvent.class)
    public void logVersion() {
        log.info("Bairam Burguer API version: {}", AppVersion.VERSION);
    }
}
