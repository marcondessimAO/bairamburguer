package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Category;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.CategoryRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminQuantityPromotionTest {
    private final AdminProductController controller = new AdminProductController();
    private final ProductRepository products = mock(ProductRepository.class);
    private final CategoryRepository categories = mock(CategoryRepository.class);
    private final Product existing = new Product();

    @BeforeEach
    void setup() {
        existing.setPrice(new BigDecimal("20.00"));
        existing.setQuantityPromotionMin(3);
        existing.setQuantityPromotionPrice(new BigDecimal("15.00"));
        when(products.findById(1)).thenReturn(Optional.of(existing));
        when(products.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(categories.findById(1)).thenReturn(Optional.of(new Category()));
        ReflectionTestUtils.setField(controller, "productRepository", products);
        ReflectionTestUtils.setField(controller, "categoryRepository", categories);
    }

    @Test
    void createsAndUpdatesQuantityPromotion() {
        String json = "{\"name\":\"Cheddar\",\"price\":20,\"categoryId\":1,\"quantityPromotionMin\":4,\"quantityPromotionPrice\":12.50}";
        Product created = (Product) controller.createProduct(json, null).getBody();
        assertThat(created.getQuantityPromotionMin()).isEqualTo(4);
        assertThat(created.getQuantityPromotionPrice()).isEqualByComparingTo("12.50");
        assertThat(controller.updateProduct(1, json, null).getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(existing.getQuantityPromotionMin()).isEqualTo(4);
    }

    @Test
    void editingOtherFieldsPreservesPromotionAndExplicitNullsDisableIt() {
        controller.updateProduct(1, "{\"name\":\"Cheddar novo\"}", null);
        assertThat(existing.getQuantityPromotionMin()).isEqualTo(3);
        controller.updateProduct(1, "{\"quantityPromotionMin\":null,\"quantityPromotionPrice\":null}", null);
        assertThat(existing.getQuantityPromotionMin()).isNull();
        assertThat(existing.getQuantityPromotionPrice()).isNull();
    }

    @Test
    void rejectsIncompleteOrInvalidPromotionBeforeSaving() {
        assertThat(controller.createProduct("{\"price\":20,\"categoryId\":1,\"quantityPromotionMin\":3}", null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(controller.createProduct("{\"price\":20,\"categoryId\":1,\"quantityPromotionMin\":1,\"quantityPromotionPrice\":15}", null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(controller.createProduct("{\"price\":20,\"categoryId\":1,\"quantityPromotionMin\":3,\"quantityPromotionPrice\":21}", null).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(products, never()).save(any());
    }
}
