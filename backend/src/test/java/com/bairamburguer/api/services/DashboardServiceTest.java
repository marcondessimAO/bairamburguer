package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.DashboardMetricsDTO;
import com.bairamburguer.api.repositories.OrderItemRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardServiceTest {
    private OrderRepository orders;
    private OrderItemRepository items;
    private DashboardService service;

    @BeforeEach
    void setUp() {
        orders = mock(OrderRepository.class);
        items = mock(OrderItemRepository.class);
        service = new DashboardService(orders, items);
        when(orders.countOrdersByStatus(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"PREPARING", 2L}));
        when(orders.getAveragePreparationTime(any(), any())).thenReturn(new Object[]{new BigDecimal("18.5"), 2L});
        when(orders.getSalesEvolution(any(), any(), anyString())).thenReturn(List.of());
        when(items.getTopProductsByQuantity(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"X-Bacon", 4L, new BigDecimal("80.00")}));
        when(items.getTopProductsByRevenue(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"X-Bacon", 4L, new BigDecimal("80.00")}));
        when(items.getLeastSoldActiveProducts(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"X-Bacon", 4L, new BigDecimal("80.00")}));
    }

    @Test
    void usesOnlyValidPaidOrderSummaryForRevenueOrdersAndAverageTicket() {
        when(orders.getValidOrderSummary(any(), any()))
                .thenReturn(new Object[]{new BigDecimal("80.00"), 4L}, new Object[]{BigDecimal.ZERO, 0L});

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 30));

        assertThat(metrics.summary().revenue()).isEqualByComparingTo("80.00");
        assertThat(metrics.summary().paidOrders()).isEqualTo(4);
        assertThat(metrics.summary().averageTicket()).isEqualByComparingTo("20.00");
        assertThat(metrics.topProducts().mostSold().get(0).revenueShare()).isEqualByComparingTo("100.00");
    }

    @Test
    void comparesWithImmediatelyPreviousPeriodOfSameLength() {
        when(orders.getValidOrderSummary(any(), any()))
                .thenReturn(new Object[]{new BigDecimal("120.00"), 6L}, new Object[]{new BigDecimal("100.00"), 5L});

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 30));

        assertThat(metrics.comparison().revenue().percentage()).isEqualByComparingTo("20.00");
        assertThat(metrics.comparison().paidOrders().percentage()).isEqualByComparingTo("20.00");
        verify(orders).getValidOrderSummary(LocalDateTime.of(2026, 7, 17, 0, 0), LocalDateTime.of(2026, 7, 24, 0, 0));
    }

    @Test
    void includesZeroValueDaysAndUsesHourlyBucketsForOneDayPeriods() {
        when(orders.getValidOrderSummary(any(), any())).thenReturn(new Object[]{BigDecimal.ZERO, 0L});

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 24));

        assertThat(metrics.salesEvolution()).hasSize(24).allSatisfy(point -> {
            assertThat(point.revenue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(point.orders()).isZero();
        });
        verify(orders).getSalesEvolution(any(), any(), org.mockito.ArgumentMatchers.eq("hour"));
    }

    @Test
    void exposesRankingsReturnedByDatabaseWithoutPerProductLookups() {
        when(orders.getValidOrderSummary(any(), any())).thenReturn(new Object[]{new BigDecimal("100.00"), 2L});
        when(items.getTopProductsByQuantity(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"Mais pedido", 7L, new BigDecimal("70.00")}));
        when(items.getTopProductsByRevenue(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"Maior receita", 2L, new BigDecimal("90.00")}));
        when(items.getLeastSoldActiveProducts(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"Menos pedido", 1L, new BigDecimal("10.00")}));

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 30));

        assertThat(metrics.topProducts().mostSold().get(0).name()).isEqualTo("Mais pedido");
        assertThat(metrics.topProducts().highestRevenue().get(0).name()).isEqualTo("Maior receita");
        assertThat(metrics.topProducts().leastSold().get(0).name()).isEqualTo("Menos pedido");
    }
}
