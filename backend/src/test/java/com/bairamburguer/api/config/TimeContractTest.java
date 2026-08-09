package com.bairamburguer.api.config;

import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.PaymentMethod;
import com.bairamburguer.api.dto.OrderTrackResponseDTO;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import com.bairamburguer.api.services.OrderService;
import com.bairamburguer.api.services.PixPaymentService;
import com.bairamburguer.api.services.StoreSettingsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TimeContractTest {
    private static final Clock FIXED_STORE_CLOCK = Clock.fixed(
            Instant.parse("2026-08-09T03:30:00Z"), TimeConfig.STORE_ZONE);

    @Test
    void serializesOrderAndNotificationTimestampsWithAnExplicitRecifeOffset() throws Exception {
        JavaTimeModule timeModule = new JavaTimeModule();
        timeModule.addSerializer(new StoreLocalDateTimeSerializer());
        ObjectMapper mapper = new ObjectMapper().registerModule(timeModule);
        Order order = new Order();
        order.setCreatedAt(LocalDateTime.of(2026, 8, 9, 0, 30));

        String json = mapper.writeValueAsString(order);

        assertThat(json).contains("\"createdAt\":\"2026-08-09T00:30:00-03:00\"");
    }

    @Test
    void statusAndPaymentTransitionsUseTheStoreClockAcrossUtcMidnight() {
        OrderRepository orders = mock(OrderRepository.class);
        OrderService service = service(orders);
        Order kitchenOrder = order(51L, PaymentMethod.DINHEIRO, "PENDING", "AWAITING_PAYMENT");
        Order payableOrder = order(52L, PaymentMethod.CARTAO, "PREPARING", "AWAITING_PAYMENT");
        when(orders.findByIdForUpdate(51L)).thenReturn(Optional.of(kitchenOrder));
        when(orders.findByIdForUpdate(52L)).thenReturn(Optional.of(payableOrder));
        when(orders.save(kitchenOrder)).thenReturn(kitchenOrder);
        when(orders.save(payableOrder)).thenReturn(payableOrder);

        service.atualizarStatus(51L, "PREPARING");
        service.markOrderAsPaid(52L, "admin");

        LocalDateTime expectedStoreTime = LocalDateTime.of(2026, 8, 9, 0, 30);
        assertThat(kitchenOrder.getProductionStartedAt()).isEqualTo(expectedStoreTime);
        assertThat(payableOrder.getPaymentConfirmedAt()).isEqualTo(expectedStoreTime);
    }

    @Test
    void trackingDtoReturnsIso8601InsteadOfAPreformattedAmbiguousTimestamp() {
        OrderRepository orders = mock(OrderRepository.class);
        Order tracked = order(53L, PaymentMethod.DINHEIRO, "PENDING", "AWAITING_PAYMENT");
        tracked.setCustomerName("Cliente");
        tracked.setCustomerPhone("83999999999");
        tracked.setTotalAmount(new BigDecimal("20.00"));
        tracked.setCreatedAt(LocalDateTime.of(2026, 8, 9, 0, 30));
        when(orders.findById(53L)).thenReturn(Optional.of(tracked));

        OrderTrackResponseDTO response = service(orders).trackOrder(53L, "83999999999");

        assertThat(response.getCreatedAt()).isEqualTo("2026-08-09T00:30:00-03:00");
    }

    private OrderService service(OrderRepository orders) {
        return new OrderService(orders, mock(ProductRepository.class), mock(NeighborhoodRepository.class),
                mock(PixPaymentService.class), mock(StoreSettingsService.class),
                mock(SimpMessagingTemplate.class), mock(AddonRepository.class), FIXED_STORE_CLOCK);
    }

    private Order order(long id, PaymentMethod method, String orderStatus, String paymentStatus) {
        Order order = new Order();
        order.setId(id);
        order.setPaymentMethod(method);
        order.setOrderStatus(orderStatus);
        order.setPaymentStatus(paymentStatus);
        return order;
    }
}
