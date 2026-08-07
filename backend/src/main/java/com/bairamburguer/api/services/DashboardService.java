package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.DashboardMetricsDTO;
import com.bairamburguer.api.repositories.OrderItemRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.projections.OrderSummaryProjection;
import com.bairamburguer.api.repositories.projections.PreparationTimeProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private static final int SCALE = 2;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public DashboardMetricsDTO getMetrics(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime endExclusive = endDate.plusDays(1).atStartOfDay();
        long days = java.time.temporal.ChronoUnit.DAYS.between(startDate, endDate) + 1;
        LocalDateTime previousStart = start.minusDays(days);

        Summary current = summary(start, endExclusive);
        Summary previous = summary(previousStart, start);

        return new DashboardMetricsDTO(
                new DashboardMetricsDTO.PeriodDTO(startDate, endDate),
                new DashboardMetricsDTO.SummaryDTO(current.revenue(), current.orders(), current.averageTicket()),
                new DashboardMetricsDTO.ComparisonDTO(
                        compare(current.revenue(), previous.revenue()),
                        compare(BigDecimal.valueOf(current.orders()), BigDecimal.valueOf(previous.orders())),
                        compare(current.averageTicket(), previous.averageTicket())
                ),
                statusCounts(start, endExclusive),
                preparationTime(start, endExclusive),
                salesEvolution(start, endExclusive, days),
                new DashboardMetricsDTO.ProductRankingsDTO(
                        productRanking(orderItemRepository.getTopProductsByQuantity(start, endExclusive), current.revenue()),
                        productRanking(orderItemRepository.getTopProductsByRevenue(start, endExclusive), current.revenue()),
                        productRanking(orderItemRepository.getLeastSoldActiveProducts(start, endExclusive), current.revenue())
                )
        );
    }

    private Summary summary(LocalDateTime start, LocalDateTime endExclusive) {
        OrderSummaryProjection summary = orderRepository.getValidOrderSummary(start, endExclusive);
        BigDecimal revenue = decimal(summary == null ? null : summary.getRevenue());
        long orders = number(summary == null ? null : summary.getOrderCount());
        BigDecimal ticket = orders == 0 ? BigDecimal.ZERO : revenue.divide(BigDecimal.valueOf(orders), SCALE, RoundingMode.HALF_UP);
        return new Summary(revenue, orders, ticket);
    }

    private DashboardMetricsDTO.ChangeDTO compare(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            String direction = current.compareTo(BigDecimal.ZERO) == 0 ? "neutral" : "up";
            return new DashboardMetricsDTO.ChangeDTO(null, direction, true);
        }
        BigDecimal percentage = current.subtract(previous).multiply(BigDecimal.valueOf(100))
                .divide(previous.abs(), SCALE, RoundingMode.HALF_UP);
        String direction = percentage.signum() > 0 ? "up" : percentage.signum() < 0 ? "down" : "neutral";
        return new DashboardMetricsDTO.ChangeDTO(percentage, direction, false);
    }

    private List<DashboardMetricsDTO.StatusCountDTO> statusCounts(LocalDateTime start, LocalDateTime endExclusive) {
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("PENDING", 0L);
        counts.put("PREPARING", 0L);
        counts.put("DISPATCHED", 0L);
        counts.put("DELIVERED", 0L);
        counts.put("CANCELED", 0L);

        for (Object[] row : orderRepository.countOrdersByStatus(start, endExclusive)) {
            String canonical = canonicalStatus((String) row[0]);
            counts.computeIfPresent(canonical, (ignored, count) -> count + number(row[1]));
        }

        return List.of(
                status("PENDING", "Aguardando preparo", counts.get("PENDING"), false),
                status("PREPARING", "Em produção", counts.get("PREPARING"), true),
                status("DISPATCHED", "Saiu para entrega", counts.get("DISPATCHED"), true),
                status("DELIVERED", "Entregue", counts.get("DELIVERED"), false),
                status("CANCELED", "Cancelado", counts.get("CANCELED"), false)
        );
    }

    private DashboardMetricsDTO.StatusCountDTO status(String status, String label, long count, boolean attention) {
        return new DashboardMetricsDTO.StatusCountDTO(status, label, count, attention);
    }

    private String canonicalStatus(String status) {
        if (status == null) return "PENDING";
        return switch (status.toUpperCase()) {
            case "RCVD", "PENDING" -> "PENDING";
            case "IN_PRODUCTION", "PREPARING" -> "PREPARING";
            case "CANCELLED", "CANCELED" -> "CANCELED";
            default -> status.toUpperCase();
        };
    }

    private DashboardMetricsDTO.PreparationTimeDTO preparationTime(LocalDateTime start, LocalDateTime endExclusive) {
        PreparationTimeProjection preparation = orderRepository.getAveragePreparationTime(start, endExclusive);
        long sampleSize = number(preparation == null ? null : preparation.getSampleSize());
        return new DashboardMetricsDTO.PreparationTimeDTO(
                sampleSize == 0 ? null : decimal(preparation.getAverageMinutes()), sampleSize);
    }

    private List<DashboardMetricsDTO.SalesPointDTO> salesEvolution(LocalDateTime start, LocalDateTime endExclusive, long days) {
        String bucket = days == 1 ? "hour" : "day";
        Map<LocalDateTime, Object[]> sales = new LinkedHashMap<>();
        for (Object[] row : orderRepository.getSalesEvolution(start, endExclusive, bucket)) {
            sales.put(asLocalDateTime(row[0]), row);
        }

        List<DashboardMetricsDTO.SalesPointDTO> points = new ArrayList<>();
        for (LocalDateTime point = start; point.isBefore(endExclusive); point = days == 1 ? point.plusHours(1) : point.plusDays(1)) {
            Object[] row = sales.get(point);
            points.add(new DashboardMetricsDTO.SalesPointDTO(point, decimal(row == null ? null : row[1]), number(row == null ? null : row[2])));
        }
        return points;
    }

    private List<DashboardMetricsDTO.TopProductDTO> productRanking(List<Object[]> rows, BigDecimal totalRevenue) {
        return rows.stream().map(row -> {
            BigDecimal revenue = decimal(row[2]);
            BigDecimal share = totalRevenue.signum() == 0 ? BigDecimal.ZERO : revenue.multiply(BigDecimal.valueOf(100))
                    .divide(totalRevenue, SCALE, RoundingMode.HALF_UP);
            return new DashboardMetricsDTO.TopProductDTO((String) row[0], number(row[1]), revenue, share);
        }).toList();
    }

    private BigDecimal decimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal decimal) return decimal;
        if (value instanceof Number number) return new BigDecimal(number.toString());
        if (value instanceof Object[]) {
            throw new IllegalArgumentException("Aggregate query returned a nested Object[] instead of a numeric value");
        }
        throw new IllegalArgumentException("Expected a numeric aggregate value, but received " + value.getClass().getName());
    }

    private long number(Object value) {
        return value == null ? 0 : ((Number) value).longValue();
    }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value instanceof Timestamp timestamp) return timestamp.toLocalDateTime();
        if (value instanceof LocalDateTime dateTime) return dateTime;
        return Timestamp.valueOf(value.toString()).toLocalDateTime();
    }

    private record Summary(BigDecimal revenue, long orders, BigDecimal averageTicket) {}
}
