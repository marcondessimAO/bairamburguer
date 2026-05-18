package com.bairamburguer.api.controllers;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public Order receberPedido(@RequestBody Order pedido) {
        return orderService.criarPedido(pedido);
    }

    @GetMapping
    public List<Order> listarPedidos() {
        return orderService.listarTodos();
    }

    @GetMapping("/customer/{customerId}")
    public List<Order> listarPedidosDoCliente(@PathVariable Long customerId) {
        return orderService.listarPorCliente(customerId);
    }
}
