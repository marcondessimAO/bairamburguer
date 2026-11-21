package com.bairamburguer.api.controllers;

import com.bairamburguer.api.config.ProductUploadConfig;
import com.bairamburguer.api.models.Category;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.repositories.CategoryRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import com.bairamburguer.api.services.ProductImageStorage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        classes = AdminProductUploadTest.UploadApplication.class)
class AdminProductUploadTest {
    @Configuration
    @EnableAutoConfiguration(exclude = {DataSourceAutoConfiguration.class, SecurityAutoConfiguration.class,
            UserDetailsServiceAutoConfiguration.class})
    @Import({AdminProductController.class, ProductUploadConfig.class, UploadExceptionHandler.class})
    static class UploadApplication {}

    @Autowired TestRestTemplate http;
    @MockBean ProductRepository products;
    @MockBean CategoryRepository categories;
    @MockBean AddonRepository addons;
    @MockBean ProductImageStorage storage;
    private Product existing;

    @BeforeEach
    void setup() {
        Category category = new Category();
        category.setId(1);
        category.setName("Combos");
        existing = new Product();
        existing.setId(7);
        existing.setImageUrl("/uploads/foto-anterior.png");
        when(categories.findById(1)).thenReturn(Optional.of(category));
        when(products.findById(7)).thenReturn(Optional.of(existing));
        when(products.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(storage.save(any())).thenReturn("/uploads/foto-nova.png");
    }

    @Test
    void createsProductWithPhotoLargerThanOldOneMegabyteLimit() {
        ResponseEntity<String> response = upload(HttpMethod.POST, "/api/v1/admin/products", 2_414_077);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("/uploads/foto-nova.png");
        verify(products).save(any());
    }

    @Test
    void replacesProductPhotoWithLargeUpload() {
        ResponseEntity<String> response = upload(HttpMethod.PUT, "/api/v1/admin/products/7", 2_414_077);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(existing.getImageUrl()).isEqualTo("/uploads/foto-nova.png");
    }

    @Test
    void preservesPreviousPhotoWhenUploadFails() {
        when(storage.save(any())).thenThrow(new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Falha no armazenamento"));
        ResponseEntity<String> response = upload(HttpMethod.PUT, "/api/v1/admin/products/7", 10);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(existing.getImageUrl()).isEqualTo("/uploads/foto-anterior.png");
        verify(products, never()).save(any());
    }

    @Test
    void rejectsOversizedPhotoBeforeSavingProduct() {
        ResponseEntity<String> response = upload(HttpMethod.POST, "/api/v1/admin/products", 5 * 1024 * 1024 + 1);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(response.getBody()).contains("5 MB");
        verify(products, never()).save(any());
        verifyNoInteractions(storage);
    }

    private ResponseEntity<String> upload(HttpMethod method, String url, int size) {
        LinkedMultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("product", "{\"name\":\"Combo\",\"price\":30.00,\"categoryId\":1}");
        body.add("image", new ByteArrayResource(new byte[size]) {
            @Override public String getFilename() { return "foto.png"; }
        });
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        return http.exchange(url, method, new HttpEntity<>(body, headers), String.class);
    }
}
