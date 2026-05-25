package com.bairamburguer.api.repositories;

import com.bairamburguer.api.models.StoreSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreSettingsRepository extends JpaRepository<StoreSettings, Long> {
}
