package com.bairamburguer.api.controllers;

import com.bairamburguer.api.dto.ManualOrderOptionsDTO;
import com.bairamburguer.api.dto.ManualOrderRequestDTO;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.services.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Order>> listarPedidos() {
        return ResponseEntity.ok(orderService.listarOperacionais());
    }

    @GetMapping("/manual/options")
    public ResponseEntity<ManualOrderOptionsDTO> manualOrderOptions() {
        return ResponseEntity.ok(new ManualOrderOptionsDTO(orderService.listDeliveryNeighborhoods()));
    }

    @PostMapping("/manual")
    public ResponseEntity<Order> createManualOrder(@Valid @RequestBody ManualOrderRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createManualOrder(request));
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

    @PatchMapping("/{id}/payment/paid")
    public ResponseEntity<Order> markOrderAsPaid(@PathVariable Long id, Principal principal) {
        String confirmedBy = principal == null ? null : principal.getName();
        return ResponseEntity.ok(orderService.markOrderAsPaid(id, confirmedBy));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleOrderError(ResponseStatusException exception) {
        String message = exception.getReason() == null ? "Nao foi possivel processar o pedido." : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("error_message", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationError(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getDefaultMessage()).orElse("Dados invalidos para o pedido.");
        return ResponseEntity.badRequest().body(Map.of("error_message", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleUnreadableBody() {
        return ResponseEntity.badRequest().body(Map.of("error_message", "Dados invalidos. Confira o metodo de pagamento e os campos informados."));
    }
}
