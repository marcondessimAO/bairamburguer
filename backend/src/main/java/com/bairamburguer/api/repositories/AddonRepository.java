package com.bairamburguer.api.repositories;

import com.bairamburguer.api.models.Addon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AddonRepository extends JpaRepository<Addon, Long> {
}
