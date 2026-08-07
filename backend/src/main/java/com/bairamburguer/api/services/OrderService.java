package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.OrderCheckoutRequestDTO;
import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.dto.OrderItemRequestDTO;
import com.bairamburguer.api.dto.ManualOrderRequestDTO;
import com.bairamburguer.api.models.Addon;
import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.OrderItem;
import com.bairamburguer.api.models.OrderSource;
import com.bairamburguer.api.models.PaymentMethod;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.AddonRepository;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataAccessException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.bairamburguer.api.dto.OrderTrackResponseDTO;
import com.bairamburguer.api.dto.TrackItemDTO;
import java.time.format.DateTimeFormatter;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    static final BigDecimal CARD_SURCHARGE = new BigDecimal("2.00");

    private static final Map<String, AddonOption> BEVERAGE_ADDONS = Map.of(
            "FANTA", new AddonOption("Fanta", BigDecimal.ZERO),
            "COCA_COLA", new AddonOption("Coca-Cola", new BigDecimal("4.00")),
            "GUARANA", new AddonOption("Guarana", new BigDecimal("4.00"))
    );
    private static final AddonOption FRIES_ADDON = new AddonOption("Batata frita", new BigDecimal("10.00"));
    private static final List<String> BLOCKED_NEIGHBORHOODS = List.of(
            "manaira", "bessa", "colinas do sul",
            "cuia", "cabo branco", "centro"
    );

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final NeighborhoodRepository neighborhoodRepository;
    private final PixPaymentService pixPaymentService;
    private final StoreSettingsService storeSettingsService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AddonRepository addonRepository;

    @Transactional
    public OrderCheckoutResponseDTO createOrder(OrderCheckoutRequestDTO request) {
        if (!storeSettingsService.isStoreOpen()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A loja esta fechada no momento.");
        }

        validateItems(request.getItems());
        PaymentMethod paymentMethod = request.getPaymentMethod();
        if (paymentMethod == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A forma de pagamento e obrigatoria.");
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
        order.setSource(OrderSource.ONLINE);
        order.setPaymentMethod(paymentMethod);

        BigDecimal totalAmount = buildOrderItems(order, request.getItems(), productMap);
        BigDecimal deliveryFee = neighborhood == null ? BigDecimal.ZERO : resolveDeliveryFee();
        BigDecimal paymentSurcharge = paymentSurchargeFor(paymentMethod);
        order.setDeliveryFee(deliveryFee);
        order.setPaymentSurcharge(paymentSurcharge);
        totalAmount = totalAmount.add(deliveryFee).add(paymentSurcharge);
        order.setTotalAmount(totalAmount);

        Order savedOrder = saveOrder(order);
        if (paymentMethod == PaymentMethod.PIX) {
            OrderCheckoutResponseDTO response = pixPaymentService.generatePixCharge(
                    savedOrder, request.getCustomerEmail(), request.getCustomerCpf());
            enrichCheckoutResponse(response, savedOrder);
            return response;
        }

        messagingTemplate.convertAndSend("/topic/orders/new", savedOrder);
        OrderCheckoutResponseDTO response = new OrderCheckoutResponseDTO();
        response.setOrderId(savedOrder.getId());
        response.setTotalAmount(savedOrder.getTotalAmount());
        enrichCheckoutResponse(response, savedOrder);
        return response;
    }

    @Transactional
    public Order createManualOrder(ManualOrderRequestDTO request) {
        validateItems(request.getItems());
        requireText(request.getCustomerName(), "O nome do cliente e obrigatorio.");
        requireText(request.getCustomerPhone(), "O telefone do cliente e obrigatorio.");
        if (request.getPaymentMethod() != PaymentMethod.DINHEIRO
                && request.getPaymentMethod() != PaymentMethod.CARTAO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pedidos manuais aceitam apenas dinheiro ou cartao.");
        }
        if (request.getPaymentMethod() == PaymentMethod.CARTAO && request.getChangeFor() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Troco para so pode ser informado em pagamentos em dinheiro.");
        }

        String deliveryMode = request.getDeliveryMode() == null ? "" : request.getDeliveryMode().trim().toUpperCase();
        Neighborhood neighborhood;
        if ("ENTREGA".equals(deliveryMode)) {
            requireText(request.getStreet(), "O endereco e obrigatorio para entrega.");
            requireText(request.getNumber(), "O numero do endereco e obrigatorio para entrega.");
            requireText(request.getNeighborhoodName(), "O bairro e obrigatorio para entrega.");
            neighborhood = findNeighborhoodByName(request.getNeighborhoodName());
        } else if ("RETIRADA".equals(deliveryMode)) {
            neighborhood = null;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de atendimento invalido. Use ENTREGA ou RETIRADA.");
        }

        List<Integer> productIds = request.getItems().stream()
                .map(item -> item.getProductId().intValue())
                .toList();
        Map<Integer, Product> productMap = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, product -> product));

        Order order = new Order();
        order.setCustomerName(request.getCustomerName().trim());
        order.setCustomerPhone(request.getCustomerPhone().trim());
        order.setNeighborhood(neighborhood);
        order.setStreet(neighborhood == null ? null : request.getStreet().trim());
        order.setNumber(neighborhood == null ? null : request.getNumber().trim());
        order.setComplement(neighborhood == null ? null : trimToNull(request.getComplement()));
        order.setObservation(trimToNull(request.getObservation()));
        order.setChangeFor(request.getChangeFor());
        order.setSource(OrderSource.MANUAL);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentStatus("AWAITING_PAYMENT");
        order.setOrderStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        BigDecimal subtotal = buildOrderItems(order, request.getItems(), productMap);
        BigDecimal deliveryFee = neighborhood == null ? BigDecimal.ZERO : resolveDeliveryFee();
        BigDecimal paymentSurcharge = paymentSurchargeFor(request.getPaymentMethod());
        order.setDeliveryFee(deliveryFee);
        order.setPaymentSurcharge(paymentSurcharge);
        order.setTotalAmount(subtotal.add(deliveryFee).add(paymentSurcharge));

        if (order.getChangeFor() != null && order.getChangeFor().compareTo(order.getTotalAmount()) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O valor para troco nao pode ser menor que o total do pedido.");
        }

        Order savedOrder = saveOrder(order);
        messagingTemplate.convertAndSend("/topic/orders/new", savedOrder);
        return savedOrder;
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
            item.setProductNameSnapshot(product.getName());
            item.setProductPriceSnapshot(product.getPrice());

            BigDecimal subtotal = product.getPrice().multiply(new BigDecimal(item.getQuantity()));
            item.setSubtotal(subtotal);

            totalAmount = totalAmount.add(subtotal);
            item.setOrder(pedido);
        }

        BigDecimal deliveryFee = resolveDeliveryFee();
        totalAmount = totalAmount.add(deliveryFee);

        pedido.setTotalAmount(totalAmount);
        pedido.setDeliveryFee(deliveryFee);
        pedido.setPaymentSurcharge(BigDecimal.ZERO);
        pedido.setNeighborhood(neighborhood);
        pedido.setOrderStatus("PENDING");
        pedido.setPaymentStatus("AWAITING_PAYMENT");
        pedido.setSource(OrderSource.ONLINE);
        pedido.setPaymentMethod(PaymentMethod.PIX);
        pedido.setCreatedAt(LocalDateTime.now());

        return orderRepository.save(pedido);
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

        LocalDateTime now = LocalDateTime.now();
        if ("PREPARING".equals(novoStatus) && order.getProductionStartedAt() == null) {
            order.setProductionStartedAt(now);
        }
        // O fluxo atual não possui o status READY. O despacho representa o fim do preparo.
        if ("DISPATCHED".equals(novoStatus) && order.getReadyAt() == null) {
            order.setReadyAt(now);
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

    public List<Order> listarOperacionais() {
        return orderRepository.findOperationalOrders();
    }

    public List<Neighborhood> listDeliveryNeighborhoods() {
        return neighborhoodRepository.findAll().stream()
                .filter(neighborhood -> !isBlockedNeighborhood(neighborhood.getName()))
                .sorted(java.util.Comparator.comparing(Neighborhood::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @Transactional
    public Order markOrderAsPaid(Long id, String confirmedBy) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido nao encontrado"));
        if (order.getPaymentMethod() == PaymentMethod.PIX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pedidos Pix so podem ser confirmados pelo webhook do Mercado Pago.");
        }
        if (order.getPaymentMethod() != PaymentMethod.DINHEIRO && order.getPaymentMethod() != PaymentMethod.CARTAO) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A forma de pagamento deste pedido nao permite confirmacao manual.");
        }
        if ("PAID".equals(order.getPaymentStatus())) {
            return order;
        }
        if (!"AWAITING_PAYMENT".equals(order.getPaymentStatus()) && !"PENDING".equals(order.getPaymentStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O pagamento deste pedido nao pode ser confirmado manualmente.");
        }

        order.setPaymentStatus("PAID");
        order.setPaymentConfirmedAt(LocalDateTime.now());
        order.setPaymentConfirmedBy(trimToNull(confirmedBy));
        Order savedOrder = saveOrder(order);
        messagingTemplate.convertAndSend("/topic/orders/update", savedOrder);
        messagingTemplate.convertAndSend("/topic/orders/status/" + savedOrder.getId(),
                java.util.Collections.singletonMap("paymentStatus", "PAID"));
        return savedOrder;
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
        BigDecimal total = BigDecimal.ZERO;
        List<String> summary = new ArrayList<>();

        if (itemDto.getAddonIds() != null && !itemDto.getAddonIds().isEmpty()) {
            List<Addon> productAddons = product.getAddons();
            List<Long> productAddonIds = productAddons.stream()
                    .filter(Addon::getActive)
                    .map(Addon::getId)
                    .collect(Collectors.toList());

            Set<Long> seenAddonIds = new HashSet<>();
            for (Long addonId : itemDto.getAddonIds()) {
                if (addonId == null || !seenAddonIds.add(addonId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A lista de adicionais contem um ID invalido ou duplicado.");
                }
                Addon addon = addonRepository.findById(addonId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adicional nao encontrado: ID " + addonId));

                if (Boolean.FALSE.equals(addon.getActive())) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adicional inativo: " + addon.getName());
                }

                if (!productAddonIds.contains(addonId)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Adicional " + addon.getName() + " nao esta vinculado ao produto " + product.getName());
                }

                total = total.add(addon.getPrice());
                if (addon.getPrice().compareTo(BigDecimal.ZERO) > 0) {
                    summary.add(addon.getName() + " (+ R$ " + addon.getPrice().toString().replace(".", ",") + ")");
                } else {
                    summary.add(addon.getName());
                }
            }
        } else {
            String beverageCode = itemDto.getBeverageAddon();
            boolean hasAddons = (beverageCode != null && !beverageCode.isBlank()) || itemDto.isFriesAddon();
            if (!hasAddons) {
                return new AddonCalculation(BigDecimal.ZERO, null);
            }

            if (!isIndividualProduct(product)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complementos permitidos apenas para Bairam Individuais.");
            }

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
        }

        return new AddonCalculation(total, summary.isEmpty() ? null : String.join("; ", summary));
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

    private BigDecimal paymentSurchargeFor(PaymentMethod paymentMethod) {
        return paymentMethod == PaymentMethod.CARTAO ? CARD_SURCHARGE : BigDecimal.ZERO;
    }

    private void enrichCheckoutResponse(OrderCheckoutResponseDTO response, Order order) {
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setPaymentSurcharge(order.getPaymentSurcharge());
    }

    private BigDecimal buildOrderItems(Order order, List<OrderItemRequestDTO> itemDtos, Map<Integer, Product> productMap) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (OrderItemRequestDTO itemDto : itemDtos) {
            Product product = productMap.get(itemDto.getProductId().intValue());
            if (product == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto nao encontrado: ID " + itemDto.getProductId());
            }
            if (Boolean.FALSE.equals(product.getIsAvailable())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto indisponivel: " + product.getName());
            }

            AddonCalculation addons = calculateAddons(product, itemDto);
            BigDecimal quantity = BigDecimal.valueOf(itemDto.getQuantity());
            BigDecimal subtotal = product.getPrice().add(addons.total()).multiply(quantity);

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setProductNameSnapshot(product.getName());
            orderItem.setProductPriceSnapshot(product.getPrice());
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setAddonsSummary(addons.summary());
            orderItem.setAddonsTotal(addons.total().multiply(quantity));
            orderItem.setSubtotal(subtotal);
            orderItem.setOrder(order);
            orderItems.add(orderItem);
            totalAmount = totalAmount.add(subtotal);
        }

        order.setItems(orderItems);
        return totalAmount;
    }

    private void validateItems(List<OrderItemRequestDTO> items) {
        if (items == null || items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O pedido deve ter ao menos um item.");
        }
        for (OrderItemRequestDTO item : items) {
            if (item == null || item.getProductId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Produto invalido no pedido.");
            }
            if (item.getQuantity() <= 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A quantidade deve ser maior que zero.");
            }
        }
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Order saveOrder(Order order) {
        try {
            return orderRepository.save(order);
        } catch (DataAccessException exception) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Nao foi possivel salvar o pedido. Tente novamente.", exception);
        }
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

    public OrderTrackResponseDTO trackOrder(Long orderId, String inputPhone) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado. Confira o número do pedido e telefone."));

        String normInput = normalizePhone(inputPhone);
        String normSaved = normalizePhone(order.getCustomerPhone());

        boolean match = normInput.equals(normSaved);
        if (!match) {
            if (normInput.startsWith("55") && normInput.substring(2).equals(normSaved)) {
                match = true;
            } else if (normSaved.startsWith("55") && normSaved.substring(2).equals(normInput)) {
                match = true;
            }
        }

        if (!match) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pedido não encontrado. Confira o número do pedido e telefone.");
        }

        OrderTrackResponseDTO dto = new OrderTrackResponseDTO();
        dto.setId(order.getId());
        dto.setOrderStatus(order.getOrderStatus());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setStatusLabel(resolveStatusLabel(order));
        dto.setCustomerName(order.getCustomerName());
        dto.setCustomerPhoneMasked(maskPhone(order.getCustomerPhone()));
        dto.setDeliveryMode(order.getNeighborhood() != null ? "ENTREGA" : "RETIRADA");
        
        if (order.getNeighborhood() != null) {
            String addr = "Rua " + order.getStreet() + ", Nº " + order.getNumber();
            if (order.getComplement() != null && !order.getComplement().isBlank()) {
                addr += " (" + order.getComplement() + ")";
            }
            addr += " - " + order.getNeighborhood().getName();
            dto.setAddressSummary(addr);
        } else {
            dto.setAddressSummary("Retirada na Loja");
        }

        List<TrackItemDTO> itemDTOs = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            TrackItemDTO idto = new TrackItemDTO();
            idto.setProductName(item.getProductNameSnapshot() != null ? item.getProductNameSnapshot() : item.getProduct().getName());
            idto.setQuantity(item.getQuantity());
            idto.setPrice(item.getProduct().getPrice());
            idto.setAddonsSummary(item.getAddonsSummary());
            idto.setAddonsTotal(item.getAddonsTotal() != null ? item.getAddonsTotal() : BigDecimal.ZERO);
            idto.setSubtotal(item.getSubtotal());
            
            subtotal = subtotal.add(item.getSubtotal());
            itemDTOs.add(idto);
        }
        dto.setItems(itemDTOs);
        dto.setSubtotal(subtotal);
        dto.setDeliveryFee(BigDecimal.ZERO);
        dto.setTotalAmount(order.getTotalAmount());

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        dto.setCreatedAt(order.getCreatedAt().format(formatter));

        return dto;
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("\\D", "");
    }

    private String maskPhone(String phone) {
        if (phone == null) return "";
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 11) {
            return "(" + digits.substring(0, 2) + ") " + digits.substring(2, 3) + "****-" + digits.substring(7);
        } else if (digits.length() == 10) {
            return "(" + digits.substring(0, 2) + ") ****-" + digits.substring(6);
        }
        if (phone.length() > 4) {
            return phone.substring(0, 4) + "****";
        }
        return phone;
    }

    private String resolveStatusLabel(Order order) {
        if ("CANCELED".equalsIgnoreCase(order.getOrderStatus()) || "CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            return "Cancelado";
        }
        if ("DELIVERED".equalsIgnoreCase(order.getOrderStatus())) {
            return "Entregue";
        }
        if ("DISPATCHED".equalsIgnoreCase(order.getOrderStatus())) {
            return "Saiu para entrega";
        }
        if ("PREPARING".equalsIgnoreCase(order.getOrderStatus()) || "IN_PRODUCTION".equalsIgnoreCase(order.getOrderStatus())) {
            return "Pedido em preparo";
        }
        if ("PENDING".equalsIgnoreCase(order.getOrderStatus()) || "RCVD".equalsIgnoreCase(order.getOrderStatus())) {
            if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
                return "Pagamento confirmado";
            }
            return "Aguardando pagamento";
        }
        return order.getOrderStatus();
    }
}
