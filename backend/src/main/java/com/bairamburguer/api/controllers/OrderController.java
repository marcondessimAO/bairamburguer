package com.bairamburguer.api.controllers;
import com.bairamburguer.api.dto.OrderCheckoutRequestDTO;
import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.services.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;
import jakarta.validation.Valid;
import java.util.List;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderCheckoutResponseDTO checkout(@Valid @RequestBody OrderCheckoutRequestDTO request) {
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

    @GetMapping("/{id}")
    public Order obterPedido(@PathVariable Long id) {
        return orderService.buscarPorId(id);
    }

    @PostMapping("/track")
    public com.bairamburguer.api.dto.OrderTrackResponseDTO trackOrder(@RequestBody com.bairamburguer.api.dto.OrderTrackRequestDTO request) {
        return orderService.trackOrder(request.getOrderId(), request.getPhone());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<java.util.Map<String, String>> handleOrderError(ResponseStatusException exception) {
        String message = exception.getReason() == null ? "Nao foi possivel processar o pedido." : exception.getReason();
        return ResponseEntity.status(exception.getStatusCode()).body(java.util.Map.of("error_message", message));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<java.util.Map<String, String>> handleValidationError(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getDefaultMessage()).orElse("Dados invalidos para o pedido.");
        return ResponseEntity.badRequest().body(java.util.Map.of("error_message", message));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<java.util.Map<String, String>> handleUnreadableBody() {
        return ResponseEntity.badRequest().body(java.util.Map.of("error_message", "Forma de pagamento ou dados do pedido invalidos."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<java.util.Map<String, String>> handleExceptions(Exception exception) {
        System.err.println("Erro no Checkout: " + exception.getClass().getSimpleName());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("error_message", "Nao foi possivel processar o pedido. Tente novamente."));
    }
}
