package com.bairamburguer.api;

import com.bairamburguer.api.config.TimeConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

import java.util.TimeZone;

// Aqui está o truque para desligar a segurança temporariamente
@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
public class BairamburguerApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone(TimeConfig.STORE_ZONE));
        SpringApplication.run(BairamburguerApplication.class, args);
    }
}
