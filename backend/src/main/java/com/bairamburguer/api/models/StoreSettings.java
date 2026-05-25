package com.bairamburguer.api.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "store_settings")
@Data
public class StoreSettings {

    @Id
    private Long id = 1L; // Singleton entity

    private Boolean isOpen = true; // Default state
}
