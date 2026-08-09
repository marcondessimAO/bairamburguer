package com.bairamburguer.api.repositories;

import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.OrderSource;
import com.bairamburguer.api.models.PaymentMethod;
import com.bairamburguer.api.repositories.projections.OrderSummaryProjection;
import com.bairamburguer.api.repositories.projections.PreparationTimeProjection;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dashboard;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;INIT=CREATE DOMAIN IF NOT EXISTS JSONB AS JSON",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class OrderRepositoryDashboardAggregateTest {
    private static final LocalDateTime PERIOD_START = LocalDateTime.of(2026, 8, 1, 0, 0);
    private static final LocalDateTime PERIOD_END = LocalDateTime.of(2026, 8, 8, 0, 0);

    @Autowired
    private OrderRepository repository;

    @Test
    void mapsPaidOrderRevenueAndCountFromTheRealJpaQuery() {
        repository.save(order("PAID", "DELIVERED", "19.90", PERIOD_START.plusDays(1), null, null));
        repository.save(order("PAID", "DELIVERED", "30.15", PERIOD_START.plusDays(2), null, null));
        repository.save(order("AWAITING_PAYMENT", "PENDING", "99.00", PERIOD_START.plusDays(3), null, null));
        repository.save(order("PAID", "CANCELED", "50.00", PERIOD_START.plusDays(4), null, null));
        repository.flush();

        OrderSummaryProjection summary = repository.getValidOrderSummary(PERIOD_START, PERIOD_END);

        assertThat(summary).isNotNull();
        assertThat(summary.getRevenue()).isEqualByComparingTo("50.05");
        assertThat(summary.getOrderCount()).isEqualTo(2L);
    }

    @Test
    void mapsZeroRevenueAndCountWhenThePeriodHasNoPaidOrders() {
        OrderSummaryProjection summary = repository.getValidOrderSummary(PERIOD_START, PERIOD_END);

        assertThat(summary).isNotNull();
        assertThat(summary.getRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(summary.getOrderCount()).isZero();
    }

    @Test
    void includesConfirmedManualCashAndCardButExcludesPendingPayments() {
        Order paidCash = order("PAID", "PREPARING", "20.00", PERIOD_START, null, null);
        paidCash.setSource(OrderSource.MANUAL);
        paidCash.setPaymentMethod(PaymentMethod.DINHEIRO);
        Order paidCard = order("PAID", "DELIVERED", "22.00", PERIOD_START.plusHours(1), null, null);
        paidCard.setSource(OrderSource.MANUAL);
        paidCard.setPaymentMethod(PaymentMethod.CARTAO);
        Order pendingCard = order("AWAITING_PAYMENT", "PENDING", "22.00", PERIOD_START.plusHours(2), null, null);
        pendingCard.setSource(OrderSource.MANUAL);
        pendingCard.setPaymentMethod(PaymentMethod.CARTAO);
        repository.save(paidCash);
        repository.save(paidCard);
        repository.save(pendingCard);
        repository.flush();

        OrderSummaryProjection summary = repository.getValidOrderSummary(PERIOD_START, PERIOD_END);

        assertThat(summary.getRevenue()).isEqualByComparingTo("42.00");
        assertThat(summary.getOrderCount()).isEqualTo(2L);
        assertThat(repository.countOrdersInPeriod(PERIOD_START, PERIOD_END)).isEqualTo(3L);
    }

    @Test
    void mapsAveragePreparationMinutesAndSampleSizeFromTheRealNativeQuery() {
        repository.save(order("PAID", "DELIVERED", "20.00", PERIOD_START,
                PERIOD_START.plusHours(1), PERIOD_START.plusHours(1).plusMinutes(10)));
        repository.save(order("PAID", "DELIVERED", "30.00", PERIOD_START,
                PERIOD_START.plusHours(2), PERIOD_START.plusHours(2).plusMinutes(20)));
        repository.flush();

        PreparationTimeProjection preparation = repository.getAveragePreparationTime(PERIOD_START, PERIOD_END);

        assertThat(preparation).isNotNull();
        assertThat(preparation.getAverageMinutes()).isEqualByComparingTo("15.00");
        assertThat(preparation.getSampleSize()).isEqualTo(2L);
    }

    @Test
    void mapsNullAverageAndZeroSampleSizeWithoutPreparationRecords() {
        PreparationTimeProjection preparation = repository.getAveragePreparationTime(PERIOD_START, PERIOD_END);

        assertThat(preparation).isNotNull();
        assertThat(preparation.getAverageMinutes()).isNull();
        assertThat(preparation.getSampleSize()).isZero();
    }

    @Test
    void countsEachOrderOnceAndKeepsCanceledSpellingsAsSeparateRawGroups() {
        repository.save(order("AWAITING_PAYMENT", "PENDING", "10.00", PERIOD_START, null, null));
        repository.save(order("PAID", "DELIVERED", "20.00", PERIOD_START.plusDays(1), null, null));
        repository.save(order("PAID", "CANCELED", "30.00", PERIOD_START.plusDays(2), null, null));
        repository.save(order("PAID", "CANCELLED", "40.00", PERIOD_START.plusDays(3), null, null));
        repository.save(order("PAID", "DELIVERED", "50.00", PERIOD_END, null, null));
        repository.flush();

        long total = repository.countOrdersInPeriod(PERIOD_START, PERIOD_END);
        Map<String, Long> byStatus = repository.countOrdersByStatus(PERIOD_START, PERIOD_END).stream()
                .collect(Collectors.toMap(row -> (String) row[0], row -> ((Number) row[1]).longValue()));

        assertThat(total).isEqualTo(4L);
        assertThat(byStatus).containsEntry("PENDING", 1L).containsEntry("DELIVERED", 1L)
                .containsEntry("CANCELED", 1L).containsEntry("CANCELLED", 1L);
        assertThat(byStatus.values().stream().mapToLong(Long::longValue).sum()).isEqualTo(total);
    }

    @Test
    void preparationTimeUsesTheOrdersCreationPeriodEvenWhenCompletionCrossesMidnight() {
        LocalDateTime createdInside = PERIOD_END.minusMinutes(30);
        repository.save(order("PAID", "DELIVERED", "20.00", createdInside,
                PERIOD_END.plusMinutes(5), PERIOD_END.plusMinutes(15)));
        repository.save(order("PAID", "DELIVERED", "30.00", PERIOD_START.minusMinutes(1),
                PERIOD_START.plusMinutes(5), PERIOD_START.plusMinutes(25)));
        repository.flush();

        PreparationTimeProjection preparation = repository.getAveragePreparationTime(PERIOD_START, PERIOD_END);

        assertThat(preparation.getSampleSize()).isEqualTo(1L);
        assertThat(preparation.getAverageMinutes()).isEqualByComparingTo("10.00");
    }

    private Order order(String paymentStatus, String orderStatus, String total, LocalDateTime createdAt,
                        LocalDateTime productionStartedAt, LocalDateTime readyAt) {
        Order order = new Order();
        order.setCustomerName("Teste Dashboard");
        order.setCustomerPhone("83999999999");
        order.setSource(OrderSource.ONLINE);
        order.setPaymentMethod(PaymentMethod.PIX);
        order.setPaymentStatus(paymentStatus);
        order.setOrderStatus(orderStatus);
        order.setTotalAmount(new BigDecimal(total));
        order.setCreatedAt(createdAt);
        order.setProductionStartedAt(productionStartedAt);
        order.setReadyAt(readyAt);
        return order;
    }
}
