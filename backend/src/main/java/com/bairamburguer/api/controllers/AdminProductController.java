package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Category;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.CategoryRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    private final String UPLOAD_DIR = "uploads/";

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createProduct(
            @RequestParam("product") String productJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            ProductRequest request = objectMapper.readValue(productJson, ProductRequest.class);

            Optional<Category> categoryOpt = categoryRepository.findById(request.categoryId);
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("Categoria não encontrada.");
            }

            Product product = new Product();
            product.setName(request.name);
            product.setDescription(request.description);
            product.setPrice(request.price);
            product.setCategory(categoryOpt.get());
            product.setIsAvailable(request.isAvailable == null || request.isAvailable);
            product.setIsPromotion(request.isPromotion != null && request.isPromotion);

            if (image != null && !image.isEmpty()) {
                String imageUrl = saveImage(image);
                if (imageUrl != null) {
                    product.setImageUrl(imageUrl);
                }
            }

            return ResponseEntity.ok(productRepository.save(product));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao processar dados do produto.");
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateProduct(
            @PathVariable Integer id,
            @RequestParam("product") String productJson,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            ProductRequest request = objectMapper.readValue(productJson, ProductRequest.class);

            if (request.categoryId != null) {
                Optional<Category> categoryOpt = categoryRepository.findById(request.categoryId);
                if (categoryOpt.isEmpty()) {
                    return ResponseEntity.badRequest().body("Categoria não encontrada.");
                }
                product.setCategory(categoryOpt.get());
            }

            if (request.name != null) product.setName(request.name);
            if (request.description != null) product.setDescription(request.description);
            if (request.price != null) product.setPrice(request.price);
            if (request.isAvailable != null) product.setIsAvailable(request.isAvailable);
            if (request.isPromotion != null) product.setIsPromotion(request.isPromotion);

            if (image != null && !image.isEmpty()) {
                String imageUrl = saveImage(image);
                if (imageUrl != null) {
                    product.setImageUrl(imageUrl);
                }
            }

            return ResponseEntity.ok(productRepository.save(product));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao processar dados do produto.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Integer id) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        product.setIsAvailable(false); // Soft Delete
        return ResponseEntity.ok(productRepository.save(product));
    }

    private String saveImage(MultipartFile image) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String filename = UUID.randomUUID().toString() + "_" + image.getOriginalFilename();
            Path filePath = uploadPath.resolve(filename);
            Files.copy(image.getInputStream(), filePath);

            return "/uploads/" + filename;
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    public static class ProductRequest {
        public String name;
        public String description;
        public BigDecimal price;
        public Integer categoryId;
        public Boolean isAvailable;
        public Boolean isPromotion;
    }
}
