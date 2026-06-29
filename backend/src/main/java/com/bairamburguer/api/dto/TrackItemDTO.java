package com.bairamburguer.api.dto;

import java.math.BigDecimal;

public class TrackItemDTO {
    private String productName;
    private int quantity;
    private BigDecimal price;
    private String addonsSummary;
    private BigDecimal addonsTotal;
    private BigDecimal subtotal;

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public int getQuantity() { return quantity; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getAddonsSummary() { return addonsSummary; }
    public void setAddonsSummary(String addonsSummary) { this.addonsSummary = addonsSummary; }

    public BigDecimal getAddonsTotal() { return addonsTotal; }
    public void setAddonsTotal(BigDecimal addonsTotal) { this.addonsTotal = addonsTotal; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
}
