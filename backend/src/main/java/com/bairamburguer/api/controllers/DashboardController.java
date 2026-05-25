package com.bairamburguer.api.controllers;

import com.bairamburguer.api.dto.DashboardMetricsDTO;
import com.bairamburguer.api.repositories.OrderItemRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class DashboardController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDTO> getMetrics() {
        java.time.LocalDateTime startOfMonth = java.time.YearMonth.now().atDay(1).atStartOfDay();
        java.time.LocalDateTime endOfMonth = java.time.YearMonth.now().atEndOfMonth().atTime(23, 59, 59);

        BigDecimal totalRevenue = orderRepository.calculateMonthlyRevenue(startOfMonth, endOfMonth);
        Long totalOrders = orderRepository.countMonthlyOrders(startOfMonth, endOfMonth);

        BigDecimal averageTicket = BigDecimal.ZERO;
        if (totalOrders != null && totalOrders > 0 && totalRevenue != null) {
            averageTicket = totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP);
        }

        List<Object[]> revenueLast7DaysData = orderRepository.getRevenueLast7Days(java.time.LocalDateTime.now().minusDays(7));
        List<DashboardMetricsDTO.DateRevenueDTO> revenueHistory = revenueLast7DaysData.stream()
                .map(row -> new DashboardMetricsDTO.DateRevenueDTO(
                        (String) row[0],
                        row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
                ))
                .collect(Collectors.toList());

        List<Object[]> top5ProductsData = orderItemRepository.getTop5Products();
        List<DashboardMetricsDTO.TopProductDTO> topProducts = top5ProductsData.stream()
                .map(row -> new DashboardMetricsDTO.TopProductDTO(
                        (String) row[0],
                        row[1] != null ? ((Number) row[1]).longValue() : 0L,
                        row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO
                ))
                .collect(Collectors.toList());

        DashboardMetricsDTO metrics = new DashboardMetricsDTO(
                totalRevenue, totalOrders, averageTicket, revenueHistory, topProducts
        );

        return ResponseEntity.ok(metrics);
    }
}
