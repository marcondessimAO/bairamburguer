package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.ManualOrderRequestDTO;
import com.bairamburguer.api.dto.OrderItemRequestDTO;
import com.bairamburguer.api.models.Addon;
import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.OrderSource;
import com.bairamburguer.api.models.PaymentMethod;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ManualOrderServiceTest {
    private OrderRepository orders;
    private ProductRepository products;
    private NeighborhoodRepository neighborhoods;
    private AddonRepository addons;
    private SimpMessagingTemplate messaging;
    private OrderService service;
    private Product product;

    @BeforeEach
    void setUp() {
        orders = mock(OrderRepository.class);
        products = mock(ProductRepository.class);
        neighborhoods = mock(NeighborhoodRepository.class);
        addons = mock(AddonRepository.class);
        messaging = mock(SimpMessagingTemplate.class);
        service = new OrderService(orders, products, neighborhoods, mock(PixPaymentService.class),
                mock(StoreSettingsService.class), messaging, addons);

        product = new Product();
        product.setId(10);
        product.setName("Bairam Teste");
        product.setPrice(new BigDecimal("20.00"));
        product.setIsAvailable(true);
        when(products.findAllById(List.of(10))).thenReturn(List.of(product));
        when(orders.save(any(Order.class))).thenAnswer(invocation -> {
            Order order = invocation.getArgument(0);
            if (order.getId() == null) order.setId(99L);
            return order;
        });
    }

    @Test
    void createsCashManualOrderAsAwaitingPaymentAndPublishesImmediately() {
        ManualOrderRequestDTO request = request(PaymentMethod.DINHEIRO);
        request.setChangeFor(new BigDecimal("50.00"));

        Order saved = service.createManualOrder(request);

        assertThat(saved.getSource()).isEqualTo(OrderSource.MANUAL);
        assertThat(saved.getPaymentMethod()).isEqualTo(PaymentMethod.DINHEIRO);
        assertThat(saved.getPaymentStatus()).isEqualTo("AWAITING_PAYMENT");
        assertThat(saved.getOrderStatus()).isEqualTo("PENDING");
        assertThat(saved.getChangeFor()).isEqualByComparingTo("50.00");
        verify(messaging).convertAndSend("/topic/orders/new", saved);
    }

    @Test
    void createsCardManualOrderAsAwaitingPayment() {
        Order saved = service.createManualOrder(request(PaymentMethod.CARTAO));

        assertThat(saved.getPaymentMethod()).isEqualTo(PaymentMethod.CARTAO);
        assertThat(saved.getPaymentStatus()).isEqualTo("AWAITING_PAYMENT");
    }

    @Test
    void recalculatesProductAndAddonSnapshotsOnBackend() {
        Addon bacon = addon(7L, "Bacon", "3.50");
        product.setAddons(List.of(bacon));
        when(addons.findById(7L)).thenReturn(Optional.of(bacon));
        ManualOrderRequestDTO request = request(PaymentMethod.DINHEIRO);
        request.getItems().get(0).setQuantity(2);
        request.getItems().get(0).setAddonIds(List.of(7L));

        Order saved = service.createManualOrder(request);

        assertThat(saved.getTotalAmount()).isEqualByComparingTo("47.00");
        assertThat(saved.getItems().get(0).getSubtotal()).isEqualByComparingTo("47.00");
        assertThat(saved.getItems().get(0).getAddonsTotal()).isEqualByComparingTo("7.00");
        assertThat(saved.getItems().get(0).getProductNameSnapshot()).isEqualTo("Bairam Teste");
        assertThat(saved.getItems().get(0).getProductPriceSnapshot()).isEqualByComparingTo("20.00");
    }

    @Test
    void appliesCurrentFreeDeliveryRuleAndValidatesNeighborhood() {
        Neighborhood neighborhood = new Neighborhood();
        neighborhood.setName("Mangabeira");
        neighborhood.setDeliveryFee(new BigDecimal("9.00"));
        when(neighborhoods.findFirstByNameIgnoreCase("Mangabeira")).thenReturn(Optional.of(neighborhood));
        ManualOrderRequestDTO request = request(PaymentMethod.CARTAO);
        request.setDeliveryMode("ENTREGA");
        request.setNeighborhoodName("Mangabeira");
        request.setStreet("Rua Teste");
        request.setNumber("10");

        Order saved = service.createManualOrder(request);

        assertThat(saved.getNeighborhood()).isSameAs(neighborhood);
        assertThat(saved.getDeliveryFee()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(saved.getTotalAmount()).isEqualByComparingTo("20.00");
    }

    @Test
    void rejectsUnknownOrUnavailableProduct() {
        when(products.findAllById(List.of(10))).thenReturn(List.of());
        assertThatThrownBy(() -> service.createManualOrder(request(PaymentMethod.DINHEIRO)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("Produto nao encontrado");

        product.setIsAvailable(false);
        when(products.findAllById(List.of(10))).thenReturn(List.of(product));
        assertThatThrownBy(() -> service.createManualOrder(request(PaymentMethod.DINHEIRO)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("Produto indisponivel");
    }

    @Test
    void rejectsEmptyOrderNonPositiveQuantityAndPixMethod() {
        ManualOrderRequestDTO empty = request(PaymentMethod.DINHEIRO);
        empty.setItems(List.of());
        assertThatThrownBy(() -> service.createManualOrder(empty))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("ao menos um item");

        ManualOrderRequestDTO invalidQuantity = request(PaymentMethod.DINHEIRO);
        invalidQuantity.getItems().get(0).setQuantity(0);
        assertThatThrownBy(() -> service.createManualOrder(invalidQuantity))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("maior que zero");

        assertThatThrownBy(() -> service.createManualOrder(request(PaymentMethod.PIX)))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("dinheiro ou cartao");
    }

    @Test
    void rejectsDeliveryWithoutAddress() {
        ManualOrderRequestDTO request = request(PaymentMethod.CARTAO);
        request.setDeliveryMode("ENTREGA");
        request.setNeighborhoodName("Mangabeira");

        assertThatThrownBy(() -> service.createManualOrder(request))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("endereco");
    }

    @Test
    void rejectsUnknownOrUnlinkedAddon() {
        ManualOrderRequestDTO request = request(PaymentMethod.DINHEIRO);
        request.getItems().get(0).setAddonIds(List.of(7L));
        when(addons.findById(7L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.createManualOrder(request))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("Adicional nao encontrado");

        Addon bacon = addon(7L, "Bacon", "3.50");
        when(addons.findById(7L)).thenReturn(Optional.of(bacon));
        assertThatThrownBy(() -> service.createManualOrder(request))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("nao esta vinculado");
    }

    @Test
    void returnsOperationalOrdersFromRepository() {
        Order manual = new Order();
        manual.setSource(OrderSource.MANUAL);
        when(orders.findOperationalOrders()).thenReturn(List.of(manual));

        assertThat(service.listarOperacionais()).containsExactly(manual);
    }

    @Test
    void operationalQueryShowsManualPendingButKeepsOnlinePixPendingHidden() throws Exception {
        Method method = OrderRepository.class.getMethod("findOperationalOrders");
        String query = method.getAnnotation(Query.class).value();

        assertThat(query).contains("OrderSource.MANUAL", "paymentStatus = 'PAID'");
        assertThat(query).doesNotContain("AWAITING_PAYMENT");
    }

    @Test
    void marksManualOrderPaidWithoutChangingKitchenStatusAndMakesItRevenueEligible() throws Exception {
        Order manual = new Order();
        manual.setId(8L);
        manual.setSource(OrderSource.MANUAL);
        manual.setPaymentMethod(PaymentMethod.DINHEIRO);
        manual.setPaymentStatus("AWAITING_PAYMENT");
        manual.setOrderStatus("PREPARING");
        when(orders.findById(8L)).thenReturn(Optional.of(manual));

        Order paid = service.markManualOrderAsPaid(8L, "admin@bairam.com");

        assertThat(paid.getPaymentStatus()).isEqualTo("PAID");
        assertThat(paid.getOrderStatus()).isEqualTo("PREPARING");
        assertThat(paid.getPaymentConfirmedAt()).isNotNull();
        assertThat(paid.getPaymentConfirmedBy()).isEqualTo("admin@bairam.com");

        String dashboardQuery = OrderRepository.class
                .getMethod("getValidOrderSummary", java.time.LocalDateTime.class, java.time.LocalDateTime.class)
                .getAnnotation(Query.class).value();
        assertThat(dashboardQuery).contains("paymentStatus = 'PAID'");
    }

    @Test
    void refusesManualConfirmationForOnlinePixOrder() {
        Order online = new Order();
        online.setId(9L);
        online.setSource(OrderSource.ONLINE);
        online.setPaymentMethod(PaymentMethod.PIX);
        online.setPaymentStatus("AWAITING_PAYMENT");
        when(orders.findById(9L)).thenReturn(Optional.of(online));

        assertThatThrownBy(() -> service.markManualOrderAsPaid(9L, "admin"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("webhook");
    }

    private ManualOrderRequestDTO request(PaymentMethod paymentMethod) {
        OrderItemRequestDTO item = new OrderItemRequestDTO();
        item.setProductId(10L);
        item.setQuantity(1);
        item.setAddonIds(List.of());

        ManualOrderRequestDTO request = new ManualOrderRequestDTO();
        request.setCustomerName("Cliente Manual");
        request.setCustomerPhone("83999999999");
        request.setDeliveryMode("RETIRADA");
        request.setPaymentMethod(paymentMethod);
        request.setObservation("Sem cebola");
        request.setItems(List.of(item));
        return request;
    }

    private Addon addon(Long id, String name, String price) {
        Addon addon = new Addon();
        addon.setId(id);
        addon.setName(name);
        addon.setPrice(new BigDecimal(price));
        addon.setActive(true);
        return addon;
    }
}
