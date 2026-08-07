package com.bairamburguer.api.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "store_settings")
@Data
public class StoreSettings {

    @Id
    private Long id = 1L; // Singleton entity

    private Boolean isOpen = true; // Default state

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
