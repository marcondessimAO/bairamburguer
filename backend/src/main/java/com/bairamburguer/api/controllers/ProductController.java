package com.bairamburguer.api.controllers;

import com.bairamburguer.api.dto.AddonResponseDTO;
import com.bairamburguer.api.dto.ProductResponseDTO;
import com.bairamburguer.api.models.Product;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import com.bairamburguer.api.repositories.ProductRepository;

import java.util.List;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<ProductResponseDTO> listarProdutos() {
        List<Product> products = productRepository.findByIsAvailableTrue();
        return products.stream().map(p -> {
            ProductResponseDTO dto = new ProductResponseDTO();
            dto.setId(p.getId());
            dto.setCategory(p.getCategory());
            dto.setName(p.getName());
            dto.setPrice(p.getPrice());
            dto.setDescription(p.getDescription());
            dto.setImageUrl(p.getImageUrl());
            dto.setIsAvailable(p.getIsAvailable());
            dto.setIsPromotion(p.getIsPromotion());
            dto.setOriginalPrice(p.getOriginalPrice());
            
            if (p.getAddons() != null) {
                List<AddonResponseDTO> activeAddons = p.getAddons().stream()
                        .filter(a -> Boolean.TRUE.equals(a.getActive()))
                        .map(a -> {
                            AddonResponseDTO ad = new AddonResponseDTO();
                            ad.setId(a.getId());
                            ad.setName(a.getName());
                            ad.setPrice(a.getPrice());
                            ad.setGroupName(a.getGroupName());
                            ad.setSelectionType(a.getSelectionType());
                            ad.setActive(a.getActive());
                            return ad;
                        })
                        .collect(Collectors.toList());
                dto.setAddons(activeAddons);
            }
            return dto;
        }).collect(Collectors.toList());
    }
}
