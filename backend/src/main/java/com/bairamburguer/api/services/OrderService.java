package com.bairamburguer.api.services;

import com.bairamburguer.api.models.Neighborhood;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.models.OrderItem;
import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.NeighborhoodRepository;
import com.bairamburguer.api.repositories.OrderRepository;
import com.bairamburguer.api.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final NeighborhoodRepository neighborhoodRepository;

    public Order criarPedido(Order pedido) {
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
        return orderRepository.save(pedido);
    }

    public Order atualizarStatus(Long id, String novoStatus) {
        // dummy return
        return null;
    }

    public List<Order> listarTodos() {
        return orderRepository.findAll();
    }

    public List<Order> listarPorCliente(Long customerId) {
        return orderRepository.findByCustomerId(customerId);
    }
}
