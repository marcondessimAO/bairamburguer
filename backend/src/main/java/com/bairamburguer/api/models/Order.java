package com.bairamburguer.api.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "neighborhood_id", nullable = true)
    private Neighborhood neighborhood;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User customer;

    @Column(name = "customer_name", length = 255)
    private String customerName;

    @Column(name = "customer_phone", length = 50)
    private String customerPhone;

    @Column(name = "street", length = 255)
    private String street;

    @Column(name = "address_number", length = 20)
    private String number;

    @Column(name = "complement", length = 255)
    private String complement;

    @Column(name = "observation", columnDefinition = "TEXT")
    private String observation;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'ONLINE'")
    private OrderSource source = OrderSource.ONLINE;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'PIX'")
    private PaymentMethod paymentMethod = PaymentMethod.PIX;

    @Column(name = "change_for", precision = 10, scale = 2)
    private BigDecimal changeFor;

    @Column(name = "delivery_fee", nullable = false, precision = 10, scale = 2, columnDefinition = "DECIMAL(10,2) DEFAULT 0")
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(name = "payment_surcharge", nullable = false, precision = 10, scale = 2, columnDefinition = "DECIMAL(10,2) DEFAULT 0")
    private BigDecimal paymentSurcharge = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_status", length = 50, columnDefinition = "VARCHAR(50) DEFAULT 'PENDING'")
    private String paymentStatus = "PENDING";

    @Column(name = "order_status", length = 50, columnDefinition = "VARCHAR(50) DEFAULT 'RCVD'")
    private String orderStatus = "RCVD";

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "production_started_at")
    private LocalDateTime productionStartedAt;

    @Column(name = "ready_at")
    private LocalDateTime readyAt;

    @Column(name = "payment_confirmed_at")
    private LocalDateTime paymentConfirmedAt;

    @Column(name = "payment_confirmed_by", length = 255)
    private String paymentConfirmedBy;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Neighborhood getNeighborhood() { return neighborhood; }
    public void setNeighborhood(Neighborhood neighborhood) { this.neighborhood = neighborhood; }
    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public String getComplement() { return complement; }
    public void setComplement(String complement) { this.complement = complement; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
    public OrderSource getSource() { return source; }
    public void setSource(OrderSource source) { this.source = source; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public BigDecimal getChangeFor() { return changeFor; }
    public void setChangeFor(BigDecimal changeFor) { this.changeFor = changeFor; }
    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }
    public BigDecimal getPaymentSurcharge() { return paymentSurcharge; }
    public void setPaymentSurcharge(BigDecimal paymentSurcharge) { this.paymentSurcharge = paymentSurcharge; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getProductionStartedAt() { return productionStartedAt; }
    public void setProductionStartedAt(LocalDateTime productionStartedAt) { this.productionStartedAt = productionStartedAt; }
    public LocalDateTime getReadyAt() { return readyAt; }
    public void setReadyAt(LocalDateTime readyAt) { this.readyAt = readyAt; }
    public LocalDateTime getPaymentConfirmedAt() { return paymentConfirmedAt; }
    public void setPaymentConfirmedAt(LocalDateTime paymentConfirmedAt) { this.paymentConfirmedAt = paymentConfirmedAt; }
    public String getPaymentConfirmedBy() { return paymentConfirmedBy; }
    public void setPaymentConfirmedBy(String paymentConfirmedBy) { this.paymentConfirmedBy = paymentConfirmedBy; }
    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
