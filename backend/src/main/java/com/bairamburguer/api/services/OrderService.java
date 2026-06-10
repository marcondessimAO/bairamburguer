package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.OrderCheckoutRequestDTO;
import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.dto.OrderItemRequestDTO;
import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.OrderItem;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private static final Map<String, AddonOption> BEVERAGE_ADDONS = Map.of(
            "FANTA", new AddonOption("Fanta", BigDecimal.ZERO),
            "PEPSI", new AddonOption("Pepsi", BigDecimal.ZERO),
            "COCA_COLA", new AddonOption("Coca-Cola", new BigDecimal("4.00")),
            "GUARANA", new AddonOption("Guarana", new BigDecimal("4.00"))
    );
    private static final AddonOption FRIES_ADDON = new AddonOption("Batata frita", new BigDecimal("10.00"));
    private static final List<String> BLOCKED_NEIGHBORHOODS = List.of("manaira", "bessa", "colinas do sul");

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final NeighborhoodRepository neighborhoodRepository;
    private final PixPaymentService pixPaymentService;
    private final StoreSettingsService storeSettingsService;
    private final SimpMessagingTemplate messagingTemplate;

    public OrderCheckoutResponseDTO createOrder(OrderCheckoutRequestDTO request) {
        if (!storeSettingsService.isStoreOpen()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A loja esta fechada no momento.");
        }

        Neighborhood neighborhood = null;
        if (request.getNeighborhoodName() != null
                && !request.getNeighborhoodName().isBlank()
                && !"null".equalsIgnoreCase(request.getNeighborhoodName())) {
            neighborhood = findNeighborhoodByName(request.getNeighborhoodName());
        }

        List<Integer> productIds = request.getItems().stream()
                .map(item -> item.getProductId().intValue())
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        Map<Integer, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setStreet(request.getStreet());
        order.setNumber(request.getNumber());
        order.setComplement(request.getComplement());
        order.setNeighborhood(neighborhood);
        order.setCreatedAt(LocalDateTime.now());
        order.setOrderStatus("PENDING");
        order.setPaymentStatus("AWAITING_PAYMENT");

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequestDTO itemDto : request.getItems()) {
            Product product = productMap.get(itemDto.getProductId().intValue());
            if (product == null) {
                throw new RuntimeException("Produto nao encontrado no banco de dados: ID " + itemDto.getProductId());
            }
            if (Boolean.FALSE.equals(product.getIsAvailable())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto indisponivel: " + product.getName());
            }

            AddonCalculation addons = calculateAddons(product, itemDto);

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setAddonsSummary(addons.summary());
            orderItem.setAddonsTotal(addons.total().multiply(new BigDecimal(itemDto.getQuantity())));

            BigDecimal subtotal = product.getPrice()
                    .add(addons.total())
                    .multiply(new BigDecimal(itemDto.getQuantity()));
            orderItem.setSubtotal(subtotal);
            orderItem.setOrder(order);

            totalAmount = totalAmount.add(subtotal);
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);

        if (neighborhood != null) {
            totalAmount = totalAmount.add(resolveDeliveryFee());
        }
        order.setTotalAmount(totalAmount);

        Order savedOrder = orderRepository.save(order);
        return pixPaymentService.generatePixCharge(savedOrder, request.getCustomerEmail(), request.getCustomerCpf());
    }

    public Order criarPedido(Order pedido) {
        if (!storeSettingsService.isStoreOpen()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A loja esta fechada no momento.");
        }

        Integer neighborhoodId = pedido.getNeighborhood().getId();
        Neighborhood neighborhood = neighborhoodRepository.findById(neighborhoodId)
                .orElseThrow(() -> new RuntimeException("Bairro nao encontrado com o ID: " + neighborhoodId));

        List<Integer> productIds = pedido.getItems().stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        Map<Integer, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItem item : pedido.getItems()) {
            Product product = productMap.get(item.getProduct().getId());
            if (product == null) {
                throw new RuntimeException("Produto nao encontrado no banco de dados");
            }
            if (Boolean.FALSE.equals(product.getIsAvailable())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto indisponivel: " + product.getName());
            }

            item.setProduct(product);

            BigDecimal subtotal = product.getPrice().multiply(new BigDecimal(item.getQuantity()));
            item.setSubtotal(subtotal);

            totalAmount = totalAmount.add(subtotal);
            item.setOrder(pedido);
        }

        totalAmount = totalAmount.add(resolveDeliveryFee());

        pedido.setTotalAmount(totalAmount);
        pedido.setNeighborhood(neighborhood);
        pedido.setOrderStatus("PENDING");
        pedido.setCreatedAt(LocalDateTime.now());

        Order savedOrder = orderRepository.save(pedido);
        messagingTemplate.convertAndSend("/topic/orders/new", savedOrder);

        return savedOrder;
    }

    public Order atualizarStatus(Long id, String novoStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));

        String currentStatus = order.getOrderStatus();
        List<String> validFlow = List.of("PENDING", "PREPARING", "DISPATCHED", "DELIVERED");

        int currentIndex = validFlow.indexOf(currentStatus);
        int nextIndex = validFlow.indexOf(novoStatus);

        if (nextIndex == -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status invalido: " + novoStatus);
        }

        if (nextIndex < currentIndex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transicao invalida: nao e permitido retroceder de " + currentStatus + " para " + novoStatus);
        }

        order.setOrderStatus(novoStatus);
        Order savedOrder = orderRepository.save(order);

        messagingTemplate.convertAndSend("/topic/orders/update", savedOrder);
        messagingTemplate.convertAndSend("/topic/orders/status/" + savedOrder.getId(), java.util.Collections.singletonMap("status", savedOrder.getOrderStatus()));

        return savedOrder;
    }

    public Order buscarPorId(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));
    }

    public List<Order> listarTodos() {
        return orderRepository.findAllByOrderByCreatedAtAsc();
    }

    public List<Order> listarPorCliente(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }

    private Neighborhood findNeighborhoodByName(String neighborhoodName) {
        String trimmedName = neighborhoodName.trim();
        if (isBlockedNeighborhood(trimmedName)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bairro nao atendido para entrega: " + neighborhoodName);
        }

        return neighborhoodRepository.findFirstByNameIgnoreCase(trimmedName)
                .filter(neighborhood -> !isBlockedNeighborhood(neighborhood.getName()))
                .orElseGet(() -> neighborhoodRepository.findAll().stream()
                        .filter(neighborhood -> !isBlockedNeighborhood(neighborhood.getName()))
                        .filter(neighborhood -> normalizeName(neighborhood.getName()).equals(normalizeName(trimmedName)))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Bairro nao encontrado com o Nome: " + neighborhoodName)));
    }

    private AddonCalculation calculateAddons(Product product, OrderItemRequestDTO itemDto) {
        String beverageCode = itemDto.getBeverageAddon();
        boolean hasAddons = (beverageCode != null && !beverageCode.isBlank()) || itemDto.isFriesAddon();
        if (!hasAddons) {
            return new AddonCalculation(BigDecimal.ZERO, null);
        }

        if (!isIndividualProduct(product)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complementos permitidos apenas para Bairam Individuais.");
        }

        BigDecimal total = BigDecimal.ZERO;
        List<String> summary = new ArrayList<>();

        if (beverageCode != null && !beverageCode.isBlank()) {
            AddonOption beverage = BEVERAGE_ADDONS.get(normalizeAddonCode(beverageCode));
            if (beverage == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refrigerante invalido: " + beverageCode);
            }
            total = total.add(beverage.price());
            summary.add("Refrigerante: " + beverage.label());
        }

        if (itemDto.isFriesAddon()) {
            total = total.add(FRIES_ADDON.price());
            summary.add(FRIES_ADDON.label());
        }

        return new AddonCalculation(total, String.join("; ", summary));
    }

    private boolean isIndividualProduct(Product product) {
        if (product.getCategory() == null || product.getCategory().getName() == null) {
            return false;
        }
        String categoryName = normalizeName(product.getCategory().getName());
        return categoryName.contains("bairam individuais") || categoryName.contains("bairans individuais");
    }

    private boolean isBlockedNeighborhood(String value) {
        return BLOCKED_NEIGHBORHOODS.contains(normalizeName(value));
    }

    private BigDecimal resolveDeliveryFee() {
        return BigDecimal.ZERO;
    }

    private String normalizeAddonCode(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("-", "_")
                .replaceAll("\\s+", "_")
                .trim()
                .toUpperCase();
    }

    private String normalizeName(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase();
    }

    private record AddonOption(String label, BigDecimal price) {
    }

    private record AddonCalculation(BigDecimal total, String summary) {
    }
}
