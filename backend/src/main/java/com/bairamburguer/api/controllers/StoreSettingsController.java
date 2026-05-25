package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.StoreSettings;
import com.bairamburguer.api.services.StoreSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class StoreSettingsController {

    private final StoreSettingsService storeSettingsService;

    @GetMapping("/settings/store/status")
    public ResponseEntity<StoreSettings> getStoreStatus() {
        return ResponseEntity.ok(storeSettingsService.getSettings());
    }

    @PostMapping("/admin/settings/store/toggle")
    public ResponseEntity<StoreSettings> toggleStoreStatus() {
        return ResponseEntity.ok(storeSettingsService.toggleStoreStatus());
    }
}
