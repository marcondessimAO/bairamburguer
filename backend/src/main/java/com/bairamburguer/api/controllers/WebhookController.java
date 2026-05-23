package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Endpoint simulado para receber o callback da Efí (Gerencianet)
     * e marcar o pedido como PAGO.
     */
    @PostMapping("/payment")
    public ResponseEntity<String> receivePixPaymentWebhook(@RequestBody Map<String, Object> payload) {
        // Num cenário real, o payload da Efí conteria o txid, endToEndId, etc.
        // Aqui vamos simular que recebemos o "orderId" diretamente no payload para teste.
        
        if (payload.containsKey("orderId")) {
            Long orderId = Long.valueOf(payload.get("orderId").toString());
            
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null) {
                // Segurança: Validação de pagamento
                order.setPaymentStatus("PAID");
                // Mudar orderStatus também para PENDING se já estiver pago (a depender do fluxo)
                Order savedOrder = orderRepository.save(order);
                
                // Dispara o alerta para a cozinha
                messagingTemplate.convertAndSend("/topic/orders/new", savedOrder);
                // Avisa o cliente que o pagamento foi aprovado
                messagingTemplate.convertAndSend("/topic/orders/status/" + orderId, java.util.Collections.singletonMap("paymentStatus", "PAID"));
                
                return ResponseEntity.ok("Pagamento confirmado para o Pedido " + orderId);
            }
        }
        
        return ResponseEntity.badRequest().body("Payload inválido ou Pedido não encontrado.");
    }
}
