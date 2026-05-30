package com.bairamburguer.api.controllers;

import com.bairamburguer.api.models.Order;
import com.bairamburguer.api.repositories.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;

import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class WebhookController {

    private final OrderRepository orderRepository;
    private final SimpMessagingTemplate messagingTemplate;


    @PostMapping("/mercadopago")
    public ResponseEntity<String> handleMercadoPagoWebhook(@RequestBody Map<String, Object> payload, @RequestParam(required = false) String topic, @RequestParam(required = false) Long id) {
        try {
            Long paymentId = id;

            if (paymentId == null && payload.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) payload.get("data");
                if (data.containsKey("id")) {
                    paymentId = Long.parseLong(data.get("id").toString());
                }
            }

            if (paymentId == null) {
                return ResponseEntity.ok("No payment ID");
            }

            PaymentClient client = new PaymentClient();
            Payment payment = client.get(paymentId);

            if (payment != null && "approved".equals(payment.getStatus())) {
                String externalReference = payment.getExternalReference();
                if (externalReference != null) {
                    Long orderId = Long.parseLong(externalReference);
                    Optional<Order> orderOpt = orderRepository.findById(orderId);
                    if (orderOpt.isPresent()) {
                        Order order = orderOpt.get();
                        if ("AWAITING_PAYMENT".equals(order.getPaymentStatus())) {
                            order.setPaymentStatus("PAID");
                            Order savedOrder = orderRepository.save(order);
                            
                            // Dispara o alerta para a cozinha
                            messagingTemplate.convertAndSend("/topic/orders/new", savedOrder);
                            // Avisa o cliente que o pagamento foi aprovado
                            messagingTemplate.convertAndSend("/topic/orders/status/" + orderId, java.util.Collections.singletonMap("paymentStatus", "PAID"));
                        }
                    }
                }
            }

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("WEBHOOK ERROR: " + e.getMessage());
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook: " + e.getMessage());
        }
    }
}
