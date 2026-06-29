package com.bairamburguer.api.dto;

public class OrderTrackRequestDTO {
    private Long orderId;
    private String phone;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}
