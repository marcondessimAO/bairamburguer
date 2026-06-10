package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Order>> listarPedidos() {
        return ResponseEntity.ok(orderService.listarTodos().stream()
                .filter(o -> "PAID".equals(o.getPaymentStatus()))
                .toList());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Order> atualizarStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String novoStatus = payload.get("status");
        if (novoStatus == null || novoStatus.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Order order = orderService.atualizarStatus(id, novoStatus);
        return ResponseEntity.ok(order);
    }
}
