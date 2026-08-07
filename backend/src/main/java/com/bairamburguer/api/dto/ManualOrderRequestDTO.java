package com.bairamburguer.api.dto;

import com.bairamburguer.api.models.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class ManualOrderRequestDTO {
    @NotBlank(message = "O nome do cliente e obrigatorio")
    private String customerName;

    @NotBlank(message = "O telefone do cliente e obrigatorio")
    private String customerPhone;

    @NotBlank(message = "O tipo de atendimento e obrigatorio")
    private String deliveryMode;

    private String street;
    private String number;
    private String complement;
    private String neighborhoodName;
    private String observation;

    @NotNull(message = "O metodo de pagamento e obrigatorio")
    private PaymentMethod paymentMethod;

    @DecimalMin(value = "0.01", message = "O valor para troco deve ser maior que zero")
    private BigDecimal changeFor;

    @Valid
    @NotEmpty(message = "O pedido deve ter ao menos um item")
    private List<OrderItemRequestDTO> items;

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public String getDeliveryMode() { return deliveryMode; }
    public void setDeliveryMode(String deliveryMode) { this.deliveryMode = deliveryMode; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getNumber() { return number; }
    public void setNumber(String number) { this.number = number; }
    public String getComplement() { return complement; }
    public void setComplement(String complement) { this.complement = complement; }
    public String getNeighborhoodName() { return neighborhoodName; }
    public void setNeighborhoodName(String neighborhoodName) { this.neighborhoodName = neighborhoodName; }
    public String getObservation() { return observation; }
    public void setObservation(String observation) { this.observation = observation; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public BigDecimal getChangeFor() { return changeFor; }
    public void setChangeFor(BigDecimal changeFor) { this.changeFor = changeFor; }
    public List<OrderItemRequestDTO> getItems() { return items; }
    public void setItems(List<OrderItemRequestDTO> items) { this.items = items; }
}
