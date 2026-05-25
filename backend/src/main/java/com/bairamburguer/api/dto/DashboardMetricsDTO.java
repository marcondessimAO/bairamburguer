package com.bairamburguer.api.dto;

import java.math.BigDecimal;
import java.util.List;

public class DashboardMetricsDTO {

    private BigDecimal totalRevenue;
    private Long totalOrders;
    private BigDecimal averageTicket;
    private List<DateRevenueDTO> revenueHistory;
    private List<TopProductDTO> topProducts;

    public DashboardMetricsDTO(BigDecimal totalRevenue, Long totalOrders, BigDecimal averageTicket,
                               List<DateRevenueDTO> revenueHistory, List<TopProductDTO> topProducts) {
        this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        this.totalOrders = totalOrders != null ? totalOrders : 0L;
        this.averageTicket = averageTicket != null ? averageTicket : BigDecimal.ZERO;
        this.revenueHistory = revenueHistory;
        this.topProducts = topProducts;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public Long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(Long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getAverageTicket() {
        return averageTicket;
    }

    public void setAverageTicket(BigDecimal averageTicket) {
        this.averageTicket = averageTicket;
    }

    public List<DateRevenueDTO> getRevenueHistory() {
        return revenueHistory;
    }

    public void setRevenueHistory(List<DateRevenueDTO> revenueHistory) {
        this.revenueHistory = revenueHistory;
    }

    public List<TopProductDTO> getTopProducts() {
        return topProducts;
    }

    public void setTopProducts(List<TopProductDTO> topProducts) {
        this.topProducts = topProducts;
    }

    public static class DateRevenueDTO {
        private String date;
        private BigDecimal revenue;

        public DateRevenueDTO(String date, BigDecimal revenue) {
            this.date = date;
            this.revenue = revenue != null ? revenue : BigDecimal.ZERO;
        }

        public String getDate() {
            return date;
        }

        public void setDate(String date) {
            this.date = date;
        }

        public BigDecimal getRevenue() {
            return revenue;
        }

        public void setRevenue(BigDecimal revenue) {
            this.revenue = revenue;
        }
    }

    public static class TopProductDTO {
        private String name;
        private Long quantity;
        private BigDecimal revenue;

        public TopProductDTO(String name, Long quantity, BigDecimal revenue) {
            this.name = name;
            this.quantity = quantity != null ? quantity : 0L;
            this.revenue = revenue != null ? revenue : BigDecimal.ZERO;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Long getQuantity() {
            return quantity;
        }

        public void setQuantity(Long quantity) {
            this.quantity = quantity;
        }

        public BigDecimal getRevenue() {
            return revenue;
        }

        public void setRevenue(BigDecimal revenue) {
            this.revenue = revenue;
        }
    }
}
