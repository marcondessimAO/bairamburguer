package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.OrderCheckoutRequestDTO;
import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.dto.OrderItemRequestDTO;
import com.bairamburguer.api.models.Category;
import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class OrderServiceTest {

    @Test
    void checkoutNormalizesNeighborhoodNameBeforeApplyingDeliveryFee() {
        OrderRepository orders = mock(OrderRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        NeighborhoodRepository neighborhoods = mock(NeighborhoodRepository.class);
        PixPaymentService pix = mock(PixPaymentService.class);
        StoreSettingsService storeSettings = mock(StoreSettingsService.class);

        Product product = new Product();
        product.setId(10);
        product.setName("Bairam Teste");
        product.setPrice(new BigDecimal("20.00"));

        Neighborhood joseAmerico = new Neighborhood();
        joseAmerico.setId(1);
        joseAmerico.setName("José Américo");
        joseAmerico.setDeliveryFee(new BigDecimal("4.99"));

        when(storeSettings.isStoreOpen()).thenReturn(true);
        when(neighborhoods.findFirstByNameIgnoreCase(anyString())).thenReturn(Optional.empty());
        when(neighborhoods.findAll()).thenReturn(List.of(joseAmerico));
        when(products.findAllById(List.of(10))).thenReturn(List.of(product));
        when(orders.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pix.generatePixCharge(any(Order.class), anyString(), anyString())).thenAnswer(invocation -> {
            Order savedOrder = invocation.getArgument(0);
            OrderCheckoutResponseDTO response = new OrderCheckoutResponseDTO();
            response.setTotalAmount(savedOrder.getTotalAmount());
            return response;
        });

        OrderService service = new OrderService(
                orders,
                products,
                neighborhoods,
                pix,
                storeSettings,
                mock(SimpMessagingTemplate.class)
        );

        OrderCheckoutResponseDTO response = service.createOrder(checkoutRequest("  JOSE   AMERICO  "));

        assertThat(response.getTotalAmount()).isEqualByComparingTo("24.99");
    }

    @Test
    void checkoutRecalculatesIndividualProductAddonsOnBackend() {
        OrderRepository orders = mock(OrderRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        NeighborhoodRepository neighborhoods = mock(NeighborhoodRepository.class);
        PixPaymentService pix = mock(PixPaymentService.class);
        StoreSettingsService storeSettings = mock(StoreSettingsService.class);

        Category category = new Category();
        category.setName("BAIRAM INDIVIDUAIS");

        Product product = new Product();
        product.setId(10);
        product.setName("Bairam Individual");
        product.setPrice(new BigDecimal("20.00"));
        product.setCategory(category);

        Neighborhood mangabeira = new Neighborhood();
        mangabeira.setId(1);
        mangabeira.setName("Mangabeira");
        mangabeira.setDeliveryFee(BigDecimal.ZERO);

        when(storeSettings.isStoreOpen()).thenReturn(true);
        when(neighborhoods.findFirstByNameIgnoreCase("Mangabeira")).thenReturn(Optional.of(mangabeira));
        when(products.findAllById(List.of(10))).thenReturn(List.of(product));
        when(orders.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pix.generatePixCharge(any(Order.class), anyString(), anyString())).thenAnswer(invocation -> {
            Order savedOrder = invocation.getArgument(0);
            OrderCheckoutResponseDTO response = new OrderCheckoutResponseDTO();
            response.setTotalAmount(savedOrder.getTotalAmount());
            return response;
        });

        OrderService service = new OrderService(
                orders,
                products,
                neighborhoods,
                pix,
                storeSettings,
                mock(SimpMessagingTemplate.class)
        );

        OrderCheckoutRequestDTO request = checkoutRequest("Mangabeira");
        request.getItems().get(0).setBeverageAddon("COCA_COLA");
        request.getItems().get(0).setFriesAddon(true);

        OrderCheckoutResponseDTO response = service.createOrder(request);

        assertThat(response.getTotalAmount()).isEqualByComparingTo("34.00");
    }

    @Test
    void checkoutRejectsRemovedDeliveryNeighborhoods() {
        OrderRepository orders = mock(OrderRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        NeighborhoodRepository neighborhoods = mock(NeighborhoodRepository.class);
        PixPaymentService pix = mock(PixPaymentService.class);
        StoreSettingsService storeSettings = mock(StoreSettingsService.class);

        when(storeSettings.isStoreOpen()).thenReturn(true);

        OrderService service = new OrderService(
                orders,
                products,
                neighborhoods,
                pix,
                storeSettings,
                mock(SimpMessagingTemplate.class)
        );

        assertThatThrownBy(() -> service.createOrder(checkoutRequest("  MANAIRA ")))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("Bairro");
    }

    private OrderCheckoutRequestDTO checkoutRequest(String neighborhoodName) {
        OrderItemRequestDTO item = new OrderItemRequestDTO();
        item.setProductId(10L);
        item.setQuantity(1);

        OrderCheckoutRequestDTO request = new OrderCheckoutRequestDTO();
        request.setCustomerName("Cliente");
        request.setCustomerPhone("83999999999");
        request.setCustomerEmail("cliente@example.com");
        request.setCustomerCpf("12345678901");
        request.setStreet("Rua Teste");
        request.setNumber("123");
        request.setNeighborhoodName(neighborhoodName);
        request.setItems(List.of(item));
        return request;
    }
}
