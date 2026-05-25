package com.bairamburguer.api.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OrderItemRequestDTO {
    @JsonProperty("product")
    private Long productId;
    private int quantity;

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }
}
