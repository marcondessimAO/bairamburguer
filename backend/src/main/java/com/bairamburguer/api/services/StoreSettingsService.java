package com.bairamburguer.api.services;

import com.bairamburguer.api.models.StoreSettings;
import com.bairamburguer.api.repositories.StoreSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.Clock;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class StoreSettingsService {

    private final StoreSettingsRepository storeSettingsRepository;
    private final Clock storeClock;

    public StoreSettings getSettings() {
        return storeSettingsRepository.findById(1L).orElseGet(() -> {
            StoreSettings newSettings = new StoreSettings();
            newSettings.setIsOpen(true);
            newSettings.setUpdatedAt(LocalDateTime.now(storeClock));
            return storeSettingsRepository.save(newSettings);
        });
    }

    public StoreSettings toggleStoreStatus() {
        StoreSettings settings = getSettings();
        settings.setIsOpen(!settings.getIsOpen());
        settings.setUpdatedAt(LocalDateTime.now(storeClock));
        return storeSettingsRepository.save(settings);
    }
    
    public boolean isStoreOpen() {
        return getSettings().getIsOpen();
    }
}
