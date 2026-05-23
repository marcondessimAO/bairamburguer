package com.bairamburguer.api.controllers;
import com.bairamburguer.api.dto.OrderCheckoutRequestDTO;
import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderCheckoutResponseDTO checkout(@RequestBody OrderCheckoutRequestDTO request) {
        return orderService.createOrder(request);
    }

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

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public java.util.Map<String, String> handleExceptions(Exception e) {
        e.printStackTrace(); // Também imprime no terminal
        return java.util.Collections.singletonMap("error_message", e.getMessage() == null ? e.toString() : e.getMessage());
    }
}
