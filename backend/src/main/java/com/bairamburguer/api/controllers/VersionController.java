package com.bairamburguer.api.controllers;

import com.bairamburguer.api.config.AppVersion;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class VersionController {

    @GetMapping("/api/version")
    public Map<String, String> version() {
        return Map.of("version", AppVersion.VERSION);
    }
}
