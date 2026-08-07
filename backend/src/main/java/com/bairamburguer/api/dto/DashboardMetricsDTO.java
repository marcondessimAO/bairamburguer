package com.bairamburguer.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DashboardMetricsDTO(
        PeriodDTO period,
        SummaryDTO summary,
        ComparisonDTO comparison,
        List<StatusCountDTO> ordersByStatus,
        PreparationTimeDTO averagePreparationTime,
        List<SalesPointDTO> salesEvolution,
        ProductRankingsDTO topProducts
) {
    public record PeriodDTO(LocalDate start, LocalDate end) {}

    public record SummaryDTO(BigDecimal revenue, long paidOrders, BigDecimal averageTicket) {}

    public record ComparisonDTO(ChangeDTO revenue, ChangeDTO paidOrders, ChangeDTO averageTicket) {}

    public record ChangeDTO(BigDecimal percentage, String direction, boolean previousValueWasZero) {}

    public record StatusCountDTO(String status, String label, long count, boolean requiresAttention) {}

    public record PreparationTimeDTO(BigDecimal minutes, long sampleSize) {}

    public record SalesPointDTO(LocalDateTime timestamp, BigDecimal revenue, long orders) {}

    public record ProductRankingsDTO(List<TopProductDTO> mostSold, List<TopProductDTO> highestRevenue,
                                     List<TopProductDTO> leastSold) {}

    public record TopProductDTO(String name, long quantity, BigDecimal revenue, BigDecimal revenueShare) {}
}
