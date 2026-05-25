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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final NeighborhoodRepository neighborhoodRepository;
    private final PixPaymentService pixPaymentService;
    private final StoreSettingsService storeSettingsService;
    private final SimpMessagingTemplate messagingTemplate;

    public OrderCheckoutResponseDTO createOrder(OrderCheckoutRequestDTO request) {
        if (!storeSettingsService.isStoreOpen()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A loja está fechada no momento.");
        }

        // 1. Buscar Bairro
        Neighborhood neighborhood = neighborhoodRepository.findFirstByNameIgnoreCase(request.getNeighborhoodName())
                .orElseThrow(() -> new RuntimeException("Bairro não encontrado com o Nome: " + request.getNeighborhoodName()));

        // 2. Extrair IDs e buscar produtos do BD (Segurança de Preço)
        List<Integer> productIds = request.getItems().stream()
                .map(item -> item.getProductId().intValue())
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        Map<Integer, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // 3. Montar a entidade Order
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
                throw new RuntimeException("Produto não encontrado no banco de dados: ID " + itemDto.getProductId());
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemDto.getQuantity());

            BigDecimal subtotal = product.getPrice().multiply(new BigDecimal(itemDto.getQuantity()));
            orderItem.setSubtotal(subtotal);
            orderItem.setOrder(order); // Vínculo bidirecional

            totalAmount = totalAmount.add(subtotal);
            orderItems.add(orderItem);
        }

        order.setItems(orderItems);

        // 4. Somar Taxa de Entrega
        totalAmount = totalAmount.add(neighborhood.getDeliveryFee());
        order.setTotalAmount(totalAmount);

        // 5. Salvar o pedido no banco
        Order savedOrder = orderRepository.save(order);

        // Dispara evento WebSocket informando novo pedido
        messagingTemplate.convertAndSend("/topic/orders/new", savedOrder);

        // 6. Gerar a cobrança Pix via Gateway
        return pixPaymentService.generatePixCharge(savedOrder, request.getCustomerEmail(), request.getCustomerCpf());
    }

    public Order criarPedido(Order pedido) {
        if (!storeSettingsService.isStoreOpen()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A loja está fechada no momento.");
        }

        // Passo 1 (Bairro): Busque o Neighborhood no banco
        
        Integer neighborhoodId = pedido.getNeighborhood().getId();
        Neighborhood neighborhood = neighborhoodRepository.findById(neighborhoodId)
                .orElseThrow(() -> new RuntimeException("Bairro não encontrado com o ID: " + neighborhoodId));

        // Passo 2 (Produtos): Extraia todos os IDs de produtos e faça uma única consulta
        List<Integer> productIds = pedido.getItems().stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);

        // Passo 3 (Mapeamento): Transforme a lista em um Map<Integer, Product>
        Map<Integer, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // Passo 4 (Cálculo dos Itens)
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItem item : pedido.getItems()) {
            Product product = productMap.get(item.getProduct().getId());
            if (product == null) {
                throw new RuntimeException("Produto não encontrado no banco de dados");
            }

            item.setProduct(product);

            BigDecimal subtotal = product.getPrice().multiply(new BigDecimal(item.getQuantity()));
            item.setSubtotal(subtotal);

            totalAmount = totalAmount.add(subtotal);

            // Garanta o vínculo bidirecional
            item.setOrder(pedido);
        }

        // Passo 5 (Taxa e Metadados)
        totalAmount = totalAmount.add(neighborhood.getDeliveryFee());

        pedido.setTotalAmount(totalAmount);
        pedido.setNeighborhood(neighborhood);
        pedido.setOrderStatus("PENDING");
        pedido.setCreatedAt(LocalDateTime.now());

        // Passo 6 (Persistência)
        Order savedOrder = orderRepository.save(pedido);

        // Dispara evento WebSocket
        messagingTemplate.convertAndSend("/topic/orders/new", savedOrder);

        return savedOrder;
    }

    public Order atualizarStatus(Long id, String novoStatus) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido não encontrado"));

        String currentStatus = order.getOrderStatus();
        List<String> validFlow = List.of("PENDING", "PREPARING", "DISPATCHED", "DELIVERED");

        int currentIndex = validFlow.indexOf(currentStatus);
        int nextIndex = validFlow.indexOf(novoStatus);

        if (nextIndex == -1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status inválido: " + novoStatus);
        }

        if (nextIndex < currentIndex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Transição inválida: Não é permitido retroceder de " + currentStatus + " para " + novoStatus);
        }

        order.setOrderStatus(novoStatus);
        Order savedOrder = orderRepository.save(order);

        // Avisa a cozinha
        messagingTemplate.convertAndSend("/topic/orders/update", savedOrder);
        // Avisa o cliente
        messagingTemplate.convertAndSend("/topic/orders/status/" + savedOrder.getId(), java.util.Collections.singletonMap("status", savedOrder.getOrderStatus()));

        return savedOrder;
    }

    public List<Order> listarTodos() {
        return orderRepository.findAllByOrderByCreatedAtAsc();
    }

    public List<Order> listarPorCliente(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }
}
