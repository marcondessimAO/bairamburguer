package com.bairamburguer.api.services;

import com.bairamburguer.api.config.TimeConfig;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.OrderItem;
import com.bairamburguer.api.models.PaymentMethod;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrderCancellationServiceTest {
    private OrderRepository orders;
    private SimpMessagingTemplate messaging;
    private OrderService service;

    @BeforeEach
    void setUp() {
        orders = mock(OrderRepository.class);
        messaging = mock(SimpMessagingTemplate.class);
        service = new OrderService(orders, mock(ProductRepository.class), mock(NeighborhoodRepository.class),
                mock(PixPaymentService.class), mock(StoreSettingsService.class), messaging, mock(AddonRepository.class),
                Clock.system(TimeConfig.STORE_ZONE));
        when(orders.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void cancelsPendingCashOrderWithoutDeletingOrChangingFinancialData() {
        OrderItem item = new OrderItem();
        item.setId(10L);
        item.setSubtotal(new BigDecimal("30.00"));
        Order order = cancelableOrder(41L, PaymentMethod.DINHEIRO, "PENDING");
        order.setItems(List.of(item));
        order.setTotalAmount(new BigDecimal("35.00"));
        order.setDeliveryFee(new BigDecimal("5.00"));
        order.setPaymentSurcharge(BigDecimal.ZERO);
        when(orders.findByIdForUpdate(41L)).thenReturn(Optional.of(order));

        Order canceled = service.cancelOrder(41L);

        assertThat(canceled.getOrderStatus()).isEqualTo("CANCELED");
        assertThat(canceled.getTotalAmount()).isEqualByComparingTo("35.00");
        assertThat(canceled.getDeliveryFee()).isEqualByComparingTo("5.00");
        assertThat(canceled.getPaymentSurcharge()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(canceled.getPaymentStatus()).isEqualTo("AWAITING_PAYMENT");
        assertThat(canceled.getItems()).containsExactly(item);
        verify(orders).save(order);
        verify(orders, never()).delete(any(Order.class));
        verify(orders, never()).deleteById(any(Long.class));
        verify(messaging).convertAndSend("/topic/orders/update", order);
    }

    @Test
    void cancelsCardOrderWhileItIsPreparingAndPreservesCardSurcharge() {
        Order order = cancelableOrder(42L, PaymentMethod.CARTAO, "PREPARING");
        order.setTotalAmount(new BigDecimal("32.00"));
        order.setPaymentSurcharge(new BigDecimal("2.00"));
        when(orders.findByIdForUpdate(42L)).thenReturn(Optional.of(order));

        Order canceled = service.cancelOrder(42L);

        assertThat(canceled.getOrderStatus()).isEqualTo("CANCELED");
        assertThat(canceled.getTotalAmount()).isEqualByComparingTo("32.00");
        assertThat(canceled.getPaymentSurcharge()).isEqualByComparingTo("2.00");
    }

    @Test
    void repeatedCancellationIsIdempotentAndDoesNotPublishOrSaveAgain() {
        Order order = cancelableOrder(43L, PaymentMethod.DINHEIRO, "CANCELED");
        when(orders.findByIdForUpdate(43L)).thenReturn(Optional.of(order));

        assertThat(service.cancelOrder(43L)).isSameAs(order);

        verify(orders, never()).save(any(Order.class));
        verify(messaging, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void canceledOrderCannotReturnToKitchenFlow() {
        Order order = cancelableOrder(44L, PaymentMethod.DINHEIRO, "CANCELED");
        when(orders.findByIdForUpdate(44L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> service.atualizarStatus(44L, "PREPARING"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("nao pode voltar");
        verify(orders, never()).save(any(Order.class));
    }

    @Test
    void finalizedOrDispatchedOrderCannotBeCanceled() {
        Order delivered = cancelableOrder(45L, PaymentMethod.DINHEIRO, "DELIVERED");
        Order dispatched = cancelableOrder(46L, PaymentMethod.CARTAO, "DISPATCHED");
        when(orders.findByIdForUpdate(45L)).thenReturn(Optional.of(delivered));
        when(orders.findByIdForUpdate(46L)).thenReturn(Optional.of(dispatched));

        assertThatThrownBy(() -> service.cancelOrder(45L))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("finalizado");
        assertThatThrownBy(() -> service.cancelOrder(46L))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("saiu para entrega");
    }

    @Test
    void pixOrdersAreNeverEligibleRegardlessOfPaymentStatus() {
        Order awaitingPix = cancelableOrder(47L, PaymentMethod.PIX, "PENDING");
        Order approvedPix = cancelableOrder(48L, PaymentMethod.PIX, "PENDING");
        approvedPix.setPaymentStatus("PAID");
        approvedPix.setPaymentConfirmedBy("MERCADO_PAGO_WEBHOOK");
        approvedPix.setPaymentConfirmedAt(LocalDateTime.now());
        when(orders.findByIdForUpdate(47L)).thenReturn(Optional.of(awaitingPix));
        when(orders.findByIdForUpdate(48L)).thenReturn(Optional.of(approvedPix));

        assertThatThrownBy(() -> service.cancelOrder(47L))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("online");
        assertThatThrownBy(() -> service.cancelOrder(48L))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("online");
        assertThat(approvedPix.getPaymentStatus()).isEqualTo("PAID");
        assertThat(approvedPix.getPaymentConfirmedBy()).isEqualTo("MERCADO_PAGO_WEBHOOK");
    }

    @Test
    void confirmedCashOrCardPaymentRequiresASeparateFinancialFlow() {
        Order paidCash = cancelableOrder(49L, PaymentMethod.DINHEIRO, "PENDING");
        paidCash.setPaymentStatus("PAID");
        when(orders.findByIdForUpdate(49L)).thenReturn(Optional.of(paidCash));

        assertThatThrownBy(() -> service.cancelOrder(49L))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("pagamento confirmado");
        assertThat(paidCash.getOrderStatus()).isEqualTo("PENDING");
    }

    @Test
    void missingOrderReturnsNotFound() {
        when(orders.findByIdForUpdate(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancelOrder(404L))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        exception -> assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    private Order cancelableOrder(Long id, PaymentMethod paymentMethod, String orderStatus) {
        Order order = new Order();
        order.setId(id);
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus("AWAITING_PAYMENT");
        order.setOrderStatus(orderStatus);
        return order;
    }
}
