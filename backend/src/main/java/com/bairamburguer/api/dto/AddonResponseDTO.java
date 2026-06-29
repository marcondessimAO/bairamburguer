package com.bairamburguer.api.dto;

import java.math.BigDecimal;

public class AddonResponseDTO {
    private Long id;
    private String name;
    private BigDecimal price;
    private String groupName;
    private String selectionType;
    private Boolean active;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public String getSelectionType() { return selectionType; }
    public void setSelectionType(String selectionType) { this.selectionType = selectionType; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
}
