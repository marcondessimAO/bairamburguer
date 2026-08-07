package com.bairamburguer.api.dto;

import com.bairamburguer.api.models.PaymentMethod;
import java.math.BigDecimal;

public class OrderCheckoutResponseDTO {
    private Long orderId;
    private BigDecimal totalAmount;
    private BigDecimal paymentSurcharge;
    private PaymentMethod paymentMethod;
    private String paymentStatus;
    private String pixQrCodeBase64;
    private String pixCopiaECola;

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public BigDecimal getPaymentSurcharge() { return paymentSurcharge; }
    public void setPaymentSurcharge(BigDecimal paymentSurcharge) { this.paymentSurcharge = paymentSurcharge; }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPixQrCodeBase64() { return pixQrCodeBase64; }
    public void setPixQrCodeBase64(String pixQrCodeBase64) { this.pixQrCodeBase64 = pixQrCodeBase64; }

    public String getPixCopiaECola() { return pixCopiaECola; }
    public void setPixCopiaECola(String pixCopiaECola) { this.pixCopiaECola = pixCopiaECola; }
}
