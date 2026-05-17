package com.bairamburguer.api.controllers;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public Order receberPedido(@RequestBody Order pedido) {
        System.out.println("=== TESTE DE RECEBIMENTO ===");
        System.out.println("Bairro recebido: " + pedido.getNeighborhood());
        System.out.println("Itens recebidos: " + pedido.getItems());

        return orderService.criarPedido(pedido);
    }

    @GetMapping
    public List<Order> listarPedidos() {
        return Collections.emptyList();
    }
}
