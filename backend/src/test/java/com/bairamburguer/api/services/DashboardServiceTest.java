package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.DashboardMetricsDTO;
import com.bairamburguer.api.repositories.OrderItemRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.projections.OrderSummaryProjection;
import com.bairamburguer.api.repositories.projections.PreparationTimeProjection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
        when(orders.countOrdersInPeriod(any(), any())).thenReturn(2L);
        when(orders.countOrdersByStatus(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"PREPARING", 2L}));
        when(orders.getAveragePreparationTime(any(), any())).thenReturn(preparationTime("18.5", 2L));
        when(orders.getSalesEvolution(any(), any(), anyString())).thenReturn(List.of());
        when(items.getTopProductsByQuantity(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"X-Bacon", 4L, new BigDecimal("80.00")}));
        when(items.getTopProductsByRevenue(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"X-Bacon", 4L, new BigDecimal("80.00")}));
        when(items.getLeastSoldActiveProducts(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"X-Bacon", 4L, new BigDecimal("80.00")}));
    }

    @Test
    void usesOnlyValidPaidOrderSummaryForRevenueOrdersAndAverageTicket() {
        when(orders.getValidOrderSummary(any(), any()))
                .thenReturn(orderSummary("80.00", 4L), orderSummary("0", 0L));
        when(orders.countOrdersInPeriod(any(), any())).thenReturn(5L, 0L);

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 30));

        assertThat(metrics.summary().revenue()).isEqualByComparingTo("80.00");
        assertThat(metrics.summary().orders()).isEqualTo(5);
        assertThat(metrics.summary().paidOrders()).isEqualTo(4);
        assertThat(metrics.summary().averageTicket()).isEqualByComparingTo("20.00");
        assertThat(metrics.topProducts().mostSold().get(0).revenueShare()).isEqualByComparingTo("100.00");
    }

    @Test
    void comparesWithImmediatelyPreviousPeriodOfSameLength() {
        when(orders.getValidOrderSummary(any(), any()))
                .thenReturn(orderSummary("120.00", 6L), orderSummary("100.00", 5L));
        when(orders.countOrdersInPeriod(any(), any())).thenReturn(6L, 5L);

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 30));

        assertThat(metrics.comparison().revenue().percentage()).isEqualByComparingTo("20.00");
        assertThat(metrics.comparison().orders().percentage()).isEqualByComparingTo("20.00");
        verify(orders).getValidOrderSummary(LocalDateTime.of(2026, 7, 17, 0, 0), LocalDateTime.of(2026, 7, 24, 0, 0));
    }

    @Test
    void usesHourlyBucketsForOneDayAndMapsGroupedAndSeparateHours() {
        when(orders.getValidOrderSummary(any(), any())).thenReturn(orderSummary("0", 0L));
        when(orders.getSalesEvolution(any(), any(), org.mockito.ArgumentMatchers.eq("hour"))).thenReturn(List.of(
                new Object[]{Timestamp.valueOf("2026-07-24 10:00:00"), new BigDecimal("30.75"), 2L},
                new Object[]{Timestamp.valueOf("2026-07-24 11:00:00"), new BigDecimal("30.75"), 1L}
        ));

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 24));

        assertThat(metrics.salesEvolution()).hasSize(24);
        assertThat(metrics.period().granularity()).isEqualTo("hour");
        assertThat(metrics.salesEvolution().get(0).timestamp().getOffset().toString()).isEqualTo("-03:00");
        assertThat(metrics.salesEvolution().get(10).revenue()).isEqualByComparingTo("30.75");
        assertThat(metrics.salesEvolution().get(10).orders()).isEqualTo(2L);
        assertThat(metrics.salesEvolution().get(11).revenue()).isEqualByComparingTo("30.75");
        assertThat(metrics.salesEvolution().get(11).orders()).isEqualTo(1L);
        verify(orders).getSalesEvolution(any(), any(), org.mockito.ArgumentMatchers.eq("hour"));
    }

    @Test
    void usesDailyBucketsForMultiDayPeriodsAndMapsGroupedAndSeparateDays() {
        when(orders.getValidOrderSummary(any(), any())).thenReturn(orderSummary("0", 0L));
        when(orders.getSalesEvolution(any(), any(), org.mockito.ArgumentMatchers.eq("day"))).thenReturn(List.of(
                new Object[]{Timestamp.valueOf("2026-08-01 00:00:00"), new BigDecimal("40.00"), 2L},
                new Object[]{Timestamp.valueOf("2026-08-02 00:00:00"), new BigDecimal("35.00"), 1L}
        ));

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 2));

        assertThat(metrics.salesEvolution()).hasSize(2);
        assertThat(metrics.period().granularity()).isEqualTo("day");
        assertThat(metrics.salesEvolution().get(0).revenue()).isEqualByComparingTo("40.00");
        assertThat(metrics.salesEvolution().get(0).orders()).isEqualTo(2L);
        assertThat(metrics.salesEvolution().get(1).revenue()).isEqualByComparingTo("35.00");
        assertThat(metrics.salesEvolution().get(1).orders()).isEqualTo(1L);
        verify(orders).getSalesEvolution(any(), any(), org.mockito.ArgumentMatchers.eq("day"));
    }

    @Test
    void exposesRankingsReturnedByDatabaseWithoutPerProductLookups() {
        when(orders.getValidOrderSummary(any(), any())).thenReturn(orderSummary("100.00", 2L));
        when(items.getTopProductsByQuantity(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"Mais pedido", 7L, new BigDecimal("70.00")}));
        when(items.getTopProductsByRevenue(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"Maior receita", 2L, new BigDecimal("90.00")}));
        when(items.getLeastSoldActiveProducts(any(), any())).thenReturn(List.<Object[]>of(new Object[]{"Menos pedido", 1L, new BigDecimal("10.00")}));

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 7, 24), LocalDate.of(2026, 7, 30));

        assertThat(metrics.topProducts().mostSold().get(0).name()).isEqualTo("Mais pedido");
        assertThat(metrics.topProducts().highestRevenue().get(0).name()).isEqualTo("Maior receita");
        assertThat(metrics.topProducts().leastSold().get(0).name()).isEqualTo("Menos pedido");
    }

    @Test
    void totalOrdersMatchesCanonicalStatusCountsWithoutDuplicatingCanceledAliases() {
        when(orders.getValidOrderSummary(any(), any())).thenReturn(orderSummary("50.00", 2L));
        when(orders.countOrdersInPeriod(any(), any())).thenReturn(6L, 0L);
        when(orders.countOrdersByStatus(any(), any())).thenReturn(List.of(
                new Object[]{"PENDING", 2L},
                new Object[]{"DELIVERED", 2L},
                new Object[]{"CANCELED", 1L},
                new Object[]{"CANCELLED", 1L}
        ));

        DashboardMetricsDTO metrics = service.getMetrics(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 7));

        assertThat(metrics.summary().orders()).isEqualTo(6L);
        assertThat(metrics.ordersByStatus().stream().mapToLong(DashboardMetricsDTO.StatusCountDTO::count).sum()).isEqualTo(6L);
        assertThat(metrics.ordersByStatus()).filteredOn(status -> status.status().equals("CANCELED"))
                .singleElement().extracting(DashboardMetricsDTO.StatusCountDTO::count).isEqualTo(2L);
    }

    @Test
    void rejectsNestedAggregateTuplesInsteadOfTryingToParseTheirObjectIdentity() {
        when(orders.getValidOrderSummary(any(), any()))
                .thenReturn(orderSummary("100.00", 2L), orderSummary("0", 0L));
        when(items.getTopProductsByQuantity(any(), any()))
                .thenReturn(List.<Object[]>of(new Object[]{"Produto", 1L, new Object[]{new BigDecimal("10.00")}}));

        assertThatThrownBy(() -> service.getMetrics(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 7)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("nested Object[]");
    }

    @Test
    void financialQueriesCountOnlyPaidOrdersRegardlessOfPaymentMethod() throws Exception {
        String summaryQuery = OrderRepository.class
                .getMethod("getValidOrderSummary", LocalDateTime.class, LocalDateTime.class)
                .getAnnotation(Query.class).value();
        String evolutionQuery = OrderRepository.class
                .getMethod("getSalesEvolution", LocalDateTime.class, LocalDateTime.class, String.class)
                .getAnnotation(Query.class).value();
        Method rankingMethod = OrderItemRepository.class
                .getMethod("getTopProductsByRevenue", LocalDateTime.class, LocalDateTime.class);
        String rankingQuery = rankingMethod.getAnnotation(Query.class).value();
        String statusQuery = OrderRepository.class
                .getMethod("countOrdersByStatus", LocalDateTime.class, LocalDateTime.class)
                .getAnnotation(Query.class).value();
        String preparationQuery = OrderRepository.class
                .getMethod("getAveragePreparationTime", LocalDateTime.class, LocalDateTime.class)
                .getAnnotation(Query.class).value();

        assertThat(summaryQuery).contains("paymentStatus = 'PAID'");
        assertThat(evolutionQuery).contains("payment_status = 'PAID'");
        assertThat(evolutionQuery.split(":bucket", -1)).hasSize(2);
        assertThat(evolutionQuery).contains("GROUP BY 1", "ORDER BY 1");
        assertThat(rankingQuery).contains("payment_status = 'PAID'");
        assertThat(summaryQuery).doesNotContain("DINHEIRO", "CARTAO");
        assertThat(statusQuery).contains("COUNT(DISTINCT o.id)");
        assertThat(preparationQuery).contains("o.created_at >= :startDate", "o.created_at < :endDate");
    }

    private OrderSummaryProjection orderSummary(String revenue, long orderCount) {
        return new OrderSummaryProjection() {
            @Override
            public BigDecimal getRevenue() {
                return new BigDecimal(revenue);
            }

            @Override
            public Long getOrderCount() {
                return orderCount;
            }
        };
    }

    private PreparationTimeProjection preparationTime(String averageMinutes, long sampleSize) {
        return new PreparationTimeProjection() {
            @Override
            public BigDecimal getAverageMinutes() {
                return new BigDecimal(averageMinutes);
            }

            @Override
            public Long getSampleSize() {
                return sampleSize;
            }
        };
    }
}
