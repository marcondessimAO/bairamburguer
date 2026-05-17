package com.bairamburguer.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

// Aqui está o truque para desligar a segurança temporariamente
@SpringBootApplication(exclude = {SecurityAutoConfiguration.class})
public class BairamburguerApplication {

    public static void main(String[] args) {
        SpringApplication.run(BairamburguerApplication.class, args);
    }
}
