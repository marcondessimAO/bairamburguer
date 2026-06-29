package com.bairamburguer.api.dto;

import com.bairamburguer.api.models.Category;
import java.math.BigDecimal;
import java.util.List;

public class ProductResponseDTO {
    private Integer id;
    private Category category;
    private String name;
    private BigDecimal price;
    private String description;
    private String imageUrl;
    private Boolean isAvailable;
    private Boolean isPromotion;
    private BigDecimal originalPrice;
    private List<AddonResponseDTO> addons;

    // Getters e Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public Boolean getIsPromotion() { return isPromotion; }
    public void setIsPromotion(Boolean isPromotion) { this.isPromotion = isPromotion; }
    public BigDecimal getOriginalPrice() { return originalPrice; }
    public void setOriginalPrice(BigDecimal originalPrice) { this.originalPrice = originalPrice; }
    public List<AddonResponseDTO> getAddons() { return addons; }
    public void setAddons(List<AddonResponseDTO> addons) { this.addons = addons; }
}
