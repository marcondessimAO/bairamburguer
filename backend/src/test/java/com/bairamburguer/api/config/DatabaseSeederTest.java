package com.bairamburguer.api.config;

import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.repositories.CategoryRepository;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import com.bairamburguer.api.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DatabaseSeederTest {

    @Test
    void seedsRequestedDeliveryFeesByNeighborhood() throws Exception {
        NeighborhoodRepository neighborhoods = mock(NeighborhoodRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        UserRepository users = mock(UserRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        Map<String, BigDecimal> savedFees = new LinkedHashMap<>();

        when(users.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(neighborhoods.findFirstByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(neighborhoods.save(any(Neighborhood.class))).thenAnswer(invocation -> {
            Neighborhood neighborhood = invocation.getArgument(0);
            savedFees.put(neighborhood.getName(), neighborhood.getDeliveryFee());
            return neighborhood;
        });
        when(products.count()).thenReturn(1L);

        DatabaseSeeder seeder = new DatabaseSeeder(
                mock(CategoryRepository.class),
                products,
                neighborhoods,
                users,
                passwordEncoder
        );

        seeder.run();

        assertThat(savedFees).containsEntry("Mangabeira", new BigDecimal("0.00"));
        assertThat(savedFees).containsEntry("Valentina", new BigDecimal("5.99"));
        assertThat(savedFees).containsEntry("Muçumagro", new BigDecimal("5.99"));
        assertThat(savedFees).containsEntry("Gramame", new BigDecimal("5.99"));
        assertThat(savedFees).containsEntry("Paratibe", new BigDecimal("5.99"));
        assertThat(savedFees).containsEntry("Nova Mangabeira", new BigDecimal("5.99"));
        assertThat(savedFees).containsEntry("Parque do Sol", new BigDecimal("5.99"));
        assertThat(savedFees).containsEntry("Portal do Sol", new BigDecimal("5.99"));
        assertThat(savedFees).containsEntry("José Américo", new BigDecimal("4.99"));
        assertThat(savedFees).containsEntry("Colibris", new BigDecimal("4.99"));
        assertThat(savedFees).containsEntry("Cidade Verde", new BigDecimal("4.99"));
        assertThat(savedFees).containsEntry("Bancários", new BigDecimal("4.99"));
        assertThat(savedFees).doesNotContainKeys("Manaíra", "Bessa", "Colinas do Sul");
    }
}
