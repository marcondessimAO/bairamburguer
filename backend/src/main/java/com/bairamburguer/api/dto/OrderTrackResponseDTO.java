package com.bairamburguer.api.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrderTrackResponseDTO {
    private Long id;
    private String orderStatus;
    private String paymentStatus;
    private String statusLabel;
    private String customerName;
    private String customerPhoneMasked;
    private String deliveryMode;
    private String addressSummary;
    private List<TrackItemDTO> items;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal totalAmount;
    private String createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getStatusLabel() { return statusLabel; }
    public void setStatusLabel(String statusLabel) { this.statusLabel = statusLabel; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhoneMasked() { return customerPhoneMasked; }
    public void setCustomerPhoneMasked(String customerPhoneMasked) { this.customerPhoneMasked = customerPhoneMasked; }

    public String getDeliveryMode() { return deliveryMode; }
    public void setDeliveryMode(String deliveryMode) { this.deliveryMode = deliveryMode; }

    public String getAddressSummary() { return addressSummary; }
    public void setAddressSummary(String addressSummary) { this.addressSummary = addressSummary; }

    public List<TrackItemDTO> getItems() { return items; }
    public void setItems(List<TrackItemDTO> items) { this.items = items; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
