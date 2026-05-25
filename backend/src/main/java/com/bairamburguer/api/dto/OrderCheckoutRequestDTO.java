package com.bairamburguer.api.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class OrderCheckoutRequestDTO {
    private String customerName;
    private String customerPhone;
    private String street;
    private String number;
    private String complement;
    private String neighborhoodName;
    
    @NotBlank(message = "O e-mail é obrigatório")
    private String customerEmail;
    
    @NotBlank(message = "O CPF é obrigatório")
    private String customerCpf;
    
    private List<OrderItemRequestDTO> items;

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

    public String getNeighborhoodName() { return neighborhoodName; }
    public void setNeighborhoodName(String neighborhoodName) { this.neighborhoodName = neighborhoodName; }

    public List<OrderItemRequestDTO> getItems() { return items; }
    public void setItems(List<OrderItemRequestDTO> items) { this.items = items; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerCpf() { return customerCpf; }
    public void setCustomerCpf(String customerCpf) { this.customerCpf = customerCpf; }
}
