package com.bairamburguer.api.services;

import com.bairamburguer.api.config.TimeConfig;
import com.bairamburguer.api.dto.OrderCheckoutRequestDTO;
import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.dto.OrderItemRequestDTO;
import com.bairamburguer.api.models.Category;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class QuantityPromotionOrderTest {
    @Test
    void discountsOnlyConfiguredProductAcrossLinesAndKeepsAddonCharges() {
        Product cheddar = product(10);
        cheddar.setQuantityPromotionMin(3);
        cheddar.setQuantityPromotionPrice(new BigDecimal("15.00"));
        Order order = checkout(List.of(cheddar), List.of(item(10, 2, false), item(10, 1, true)));
        assertThat(order.getTotalAmount()).isEqualByComparingTo("55.00");
        assertThat(order.getItems().get(0).getSubtotal()).isEqualByComparingTo("30.00");
        assertThat(order.getItems().get(1).getSubtotal()).isEqualByComparingTo("25.00");
        assertThat(order.getItems().get(1).getAddonsTotal()).isEqualByComparingTo("10.00");
        assertThat(order.getItems().get(0).getProductPriceSnapshot()).isEqualByComparingTo("15.00");
        assertThat(cheddar.getPrice()).isEqualByComparingTo("20.00");
    }

    @Test
    void otherProductsDoNotCountTowardsQuantityPromotion() {
        Product cheddar = product(10);
        cheddar.setQuantityPromotionMin(3);
        cheddar.setQuantityPromotionPrice(new BigDecimal("15.00"));
        Order order = checkout(List.of(cheddar, product(11)), List.of(item(10, 2, false), item(11, 1, false)));
        assertThat(order.getTotalAmount()).isEqualByComparingTo("60.00");
    }

    @Test
    void productWithoutQuantityPromotionKeepsRegularPrice() {
        Order order = checkout(List.of(product(10)), List.of(item(10, 3, false)));
        assertThat(order.getTotalAmount()).isEqualByComparingTo("60.00");
    }

    @Test
    void thresholdIsConfigurableAndInclusive() {
        Product cheddar = product(10);
        cheddar.setQuantityPromotionMin(4);
        cheddar.setQuantityPromotionPrice(new BigDecimal("15.00"));
        assertThat(checkout(List.of(cheddar), List.of(item(10, 3, false))).getTotalAmount()).isEqualByComparingTo("60.00");
        assertThat(checkout(List.of(cheddar), List.of(item(10, 4, false))).getTotalAmount()).isEqualByComparingTo("60.00");
    }

    private Order checkout(List<Product> catalog, List<OrderItemRequestDTO> items) {
        OrderRepository orders = mock(OrderRepository.class);
        ProductRepository products = mock(ProductRepository.class);
        PixPaymentService pix = mock(PixPaymentService.class);
        StoreSettingsService store = mock(StoreSettingsService.class);
        when(store.isStoreOpen()).thenReturn(true);
        when(products.findAllById(any())).thenReturn(catalog);
        when(orders.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(pix.generatePixCharge(any(), anyString(), anyString())).thenReturn(new OrderCheckoutResponseDTO());
        OrderService service = new OrderService(orders, products, mock(NeighborhoodRepository.class), pix, store,
                mock(SimpMessagingTemplate.class), mock(AddonRepository.class), Clock.system(TimeConfig.STORE_ZONE));
        OrderCheckoutRequestDTO request = new OrderCheckoutRequestDTO();
        request.setCustomerName("Cliente");
        request.setCustomerPhone("83999999999");
        request.setCustomerEmail("cliente@example.com");
        request.setCustomerCpf("12345678901");
        request.setItems(items);
        service.createOrder(request);
        ArgumentCaptor<Order> captured = ArgumentCaptor.forClass(Order.class);
        verify(pix).generatePixCharge(captured.capture(), anyString(), anyString());
        return captured.getValue();
    }

    private Product product(int id) {
        Product product = new Product();
        product.setId(id);
        product.setName("Bairam " + id);
        product.setPrice(new BigDecimal("20.00"));
        product.setIsAvailable(true);
        Category category = new Category();
        category.setName("BAIRAM INDIVIDUAIS");
        product.setCategory(category);
        return product;
    }

    private OrderItemRequestDTO item(long id, int quantity, boolean fries) {
        OrderItemRequestDTO item = new OrderItemRequestDTO();
        item.setProductId(id);
        item.setQuantity(quantity);
        item.setFriesAddon(fries);
        return item;
    }
}
