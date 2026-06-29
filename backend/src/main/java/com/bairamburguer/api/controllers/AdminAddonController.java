package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Addon;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/addons")
public class AdminAddonController {

    @Autowired
    private AddonRepository addonRepository;

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<List<Addon>> getAllAddons() {
        return ResponseEntity.ok(addonRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createAddon(@RequestBody AddonRequest request) {
        try {
            Addon addon = new Addon();
            addon.setName(request.name);
            addon.setPrice(request.price);
            addon.setGroupName(request.groupName);
            addon.setSelectionType(request.selectionType != null ? request.selectionType : "MULTIPLE");
            addon.setActive(request.active == null || request.active);

            Addon savedAddon = addonRepository.save(addon);

            if (request.productIds != null && !request.productIds.isEmpty()) {
                List<Product> products = productRepository.findAllById(request.productIds);
                for (Product p : products) {
                    if (!p.getAddons().contains(savedAddon)) {
                        p.getAddons().add(savedAddon);
                        productRepository.save(p);
                    }
                }
            }

            return ResponseEntity.ok(savedAddon);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao criar adicional.");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAddon(@PathVariable Long id, @RequestBody AddonRequest request) {
        Optional<Addon> addonOpt = addonRepository.findById(id);
        if (addonOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            Addon addon = addonOpt.get();
            if (request.name != null) addon.setName(request.name);
            if (request.price != null) addon.setPrice(request.price);
            if (request.groupName != null) addon.setGroupName(request.groupName);
            if (request.selectionType != null) addon.setSelectionType(request.selectionType);
            if (request.active != null) addon.setActive(request.active);

            Addon savedAddon = addonRepository.save(addon);

            if (request.productIds != null) {
                // Remove addon de todos os produtos primeiro
                List<Product> allProducts = productRepository.findAll();
                for (Product p : allProducts) {
                    if (p.getAddons().contains(savedAddon)) {
                        p.getAddons().remove(savedAddon);
                        productRepository.save(p);
                    }
                }

                // Adiciona nos produtos selecionados
                List<Product> newProducts = productRepository.findAllById(request.productIds);
                for (Product p : newProducts) {
                    if (!p.getAddons().contains(savedAddon)) {
                        p.getAddons().add(savedAddon);
                        productRepository.save(p);
                    }
                }
            }

            return ResponseEntity.ok(savedAddon);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao atualizar adicional.");
        }
    }

    @PatchMapping("/{id}/active")
    public ResponseEntity<?> toggleActive(@PathVariable Long id, @RequestBody ActiveRequest request) {
        Optional<Addon> addonOpt = addonRepository.findById(id);
        if (addonOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Addon addon = addonOpt.get();
        addon.setActive(request.active);
        return ResponseEntity.ok(addonRepository.save(addon));
    }

    public static class AddonRequest {
        public String name;
        public BigDecimal price;
        public String groupName;
        public String selectionType;
        public Boolean active;
        public List<Integer> productIds;
    }

    public static class ActiveRequest {
        public Boolean active;
    }
}
