package com.bairamburguer.api.services;

import com.bairamburguer.api.config.TimeConfig;
import com.bairamburguer.api.dto.OrderCheckoutRequestDTO;
import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.dto.OrderItemRequestDTO;
import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.PaymentMethod;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class OrderDeliveryPromotionTest {
    @ParameterizedTest
    @CsvSource({
            "Valentina,29.99,DINHEIRO,0.00,0.00",
            "Valentina,30.00,DINHEIRO,0.00,0.00",
            "Valentina,30.01,DINHEIRO,0.00,0.00",
            "Valentina,50.00,PIX,0.00,0.00",
            "Valentina,30.00,CARTAO,0.00,2.00",
            "Valentina,29.99,CARTAO,0.00,2.00",
            "Valentina,29.99,PIX,0.00,0.00",
            "Valentina,30.01,CARTAO,0.00,2.00",
            "Nova Mangabeira,30.00,DINHEIRO,0.00,0.00",
            "Mangabeira,29.99,DINHEIRO,0.00,0.00",
            "Bancarios,50.00,DINHEIRO,0.00,0.00",
            "RETIRADA,29.99,PIX,0.00,0.00",
            "RETIRADA,30.00,PIX,0.00,0.00"
    })
    void savesDeliveryFeeAndChargesTotalBeforePaymentSurcharge(
            String neighborhoodName, String price, PaymentMethod method, String fee, String surcharge) {
        OrderRepository orders = mock(OrderRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        NeighborhoodRepository neighborhoods = mock(NeighborhoodRepository.class);
        PixPaymentService pix = mock(PixPaymentService.class);
        StoreSettingsService store = mock(StoreSettingsService.class);

        Product product = new Product();
        product.setId(10);
        product.setName("Lanche");
        product.setPrice(new BigDecimal(price));
        product.setIsAvailable(true);
        Neighborhood neighborhood = new Neighborhood();
        neighborhood.setName(neighborhoodName);
        neighborhood.setDeliveryFee(new BigDecimal("99.00"));
        when(store.isStoreOpen()).thenReturn(true);
        when(products.findAllById(List.of(10))).thenReturn(List.of(product));
        if (!"RETIRADA".equals(neighborhoodName)) {
            when(neighborhoods.findFirstByNameIgnoreCase(neighborhoodName)).thenReturn(Optional.of(neighborhood));
        }
        when(orders.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        if (method == PaymentMethod.PIX) {
            when(pix.generatePixCharge(any(Order.class), anyString(), anyString()))
                    .thenReturn(new OrderCheckoutResponseDTO());
        }

        OrderService service = new OrderService(orders, products, neighborhoods, pix, store,
                mock(SimpMessagingTemplate.class), mock(AddonRepository.class), Clock.system(TimeConfig.STORE_ZONE));
        OrderItemRequestDTO item = new OrderItemRequestDTO();
        item.setProductId(10L);
        item.setQuantity(1);
        OrderCheckoutRequestDTO request = new OrderCheckoutRequestDTO();
        request.setCustomerName("Cliente");
        request.setCustomerPhone("83999999999");
        request.setCustomerEmail("cliente@example.com");
        request.setCustomerCpf("12345678901");
        request.setNeighborhoodName("RETIRADA".equals(neighborhoodName) ? null : neighborhoodName);
        request.setStreet("Rua Teste");
        request.setNumber("123");
        request.setPaymentMethod(method);
        request.setItems(List.of(item));

        if (new BigDecimal(price).compareTo(new BigDecimal("30.00")) < 0) {
            assertThatThrownBy(() -> service.createOrder(request))
                    .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                    .hasMessageContaining("pedido minimo");
            verify(orders, never()).save(any());
            verify(pix, never()).generatePixCharge(any(), anyString(), anyString());
            return;
        }

        service.createOrder(request);

        ArgumentCaptor<Order> saved = ArgumentCaptor.forClass(Order.class);
        verify(orders).save(saved.capture());
        Order order = saved.getValue();
        assertThat(order.getDeliveryFee()).isEqualByComparingTo(fee);
        assertThat(order.getTotalAmount()).isEqualByComparingTo(
                new BigDecimal(price).add(new BigDecimal(fee)).add(new BigDecimal(surcharge)));
        if (method == PaymentMethod.PIX) {
            verify(pix).generatePixCharge(order, "cliente@example.com", "12345678901");
        }
    }
}
