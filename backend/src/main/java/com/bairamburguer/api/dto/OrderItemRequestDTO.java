package com.bairamburguer.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public class OrderItemRequestDTO {
    @JsonProperty("product")
    private Long productId;
    private int quantity;
    private String beverageAddon;
    private boolean friesAddon;
    private List<Long> addonIds;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public String getBeverageAddon() { return beverageAddon; }
    public void setBeverageAddon(String beverageAddon) { this.beverageAddon = beverageAddon; }

    public boolean isFriesAddon() { return friesAddon; }
    public void setFriesAddon(boolean friesAddon) { this.friesAddon = friesAddon; }

    public List<Long> getAddonIds() { return addonIds; }
    public void setAddonIds(List<Long> addonIds) { this.addonIds = addonIds; }
}
