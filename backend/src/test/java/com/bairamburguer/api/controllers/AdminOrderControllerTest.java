package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.services.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminOrderControllerTest {

    @Test
    void patchStatusDelegatesPreparingStatusToOrderService() {
        OrderService orderService = mock(OrderService.class);
        Order updatedOrder = new Order();
        updatedOrder.setId(7L);
        updatedOrder.setOrderStatus("PREPARING");
        when(orderService.atualizarStatus(7L, "PREPARING")).thenReturn(updatedOrder);

        AdminOrderController controller = new AdminOrderController(orderService);

        ResponseEntity<Order> response = controller.atualizarStatus(7L, Map.of("status", "PREPARING"));

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isSameAs(updatedOrder);
        verify(orderService).atualizarStatus(7L, "PREPARING");
    }
}
