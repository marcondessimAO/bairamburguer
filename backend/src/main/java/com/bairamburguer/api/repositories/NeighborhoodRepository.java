package com.bairamburguer.api.repositories;

import com.bairamburguer.api.models.Neighborhood;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NeighborhoodRepository extends JpaRepository<Neighborhood, Integer> {
    Optional<Neighborhood> findFirstByNameIgnoreCase(String name);
}
