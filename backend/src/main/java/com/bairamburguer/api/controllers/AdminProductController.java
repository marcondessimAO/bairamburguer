package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Category;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.models.Addon;
import com.bairamburguer.api.repositories.CategoryRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.services.ProductImageStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products")
public class AdminProductController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AddonRepository addonRepository;

    @Autowired
    private ProductImageStorage imageStorage;

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
            product.setOriginalPrice(request.originalPrice);
            product.setQuantityPromotionMin(request.quantityPromotionMin);
            product.setQuantityPromotionPrice(request.quantityPromotionPrice);
            validateQuantityPromotion(product);

            if (image != null && !image.isEmpty()) {
                String imageUrl = imageStorage.save(image);
                if (imageUrl != null) {
                    product.setImageUrl(imageUrl);
                }
            }

            if (request.addonIds != null) {
                List<Addon> addons = addonRepository.findAllById(request.addonIds);
                product.setAddons(addons);
            }

            return ResponseEntity.ok(productRepository.save(product));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
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
            if (request.originalPrice != null) product.setOriginalPrice(request.originalPrice);
            if (objectMapper.readTree(productJson).has("quantityPromotionMin")
                    || objectMapper.readTree(productJson).has("quantityPromotionPrice")) {
                product.setQuantityPromotionMin(request.quantityPromotionMin);
                product.setQuantityPromotionPrice(request.quantityPromotionPrice);
            }
            validateQuantityPromotion(product);

            if (image != null && !image.isEmpty()) {
                String imageUrl = imageStorage.save(image);
                if (imageUrl != null) {
                    product.setImageUrl(imageUrl);
                }
            }

            if (request.addonIds != null) {
                List<Addon> addons = addonRepository.findAllById(request.addonIds);
                product.setAddons(addons);
            }

            return ResponseEntity.ok(productRepository.save(product));
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
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

    @PatchMapping("/{id}/active")
    public ResponseEntity<?> toggleProductActive(
            @PathVariable Integer id,
            @RequestBody ActiveRequest request) {
        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        product.setIsAvailable(request.active);
        return ResponseEntity.ok(productRepository.save(product));
    }

    public static class ActiveRequest {
        public Boolean active;
    }

    private void validateQuantityPromotion(Product product) {
        Integer minimum = product.getQuantityPromotionMin();
        BigDecimal promotionalPrice = product.getQuantityPromotionPrice();
        if (minimum == null && promotionalPrice == null) return;
        if (minimum == null || minimum < 2 || promotionalPrice == null || promotionalPrice.signum() <= 0
                || promotionalPrice.scale() > 2 || product.getPrice() == null
                || promotionalPrice.compareTo(product.getPrice()) >= 0) {
            throw new ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Informe quantidade minima de 2 unidades e preco promocional positivo, com ate duas casas decimais e menor que o preco normal.");
        }
    }

    public static class ProductRequest {
        public String name;
        public String description;
        public BigDecimal price;
        public Integer categoryId;
        public Boolean isAvailable;
        public Boolean isPromotion;
        public BigDecimal originalPrice;
        public Integer quantityPromotionMin;
        public BigDecimal quantityPromotionPrice;
        public List<Long> addonIds;
    }
}
