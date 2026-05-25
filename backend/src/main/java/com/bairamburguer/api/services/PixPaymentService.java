package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.models.Order;
import com.mercadopago.client.common.IdentificationRequest;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.payment.PaymentCreateRequest;
import com.mercadopago.client.payment.PaymentPayerRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
public class PixPaymentService {

    public OrderCheckoutResponseDTO generatePixCharge(Order order, String customerEmail, String customerCpf) {
        OrderCheckoutResponseDTO response = new OrderCheckoutResponseDTO();
        response.setOrderId(order.getId());
        response.setTotalAmount(order.getTotalAmount());
        
        try {
            PaymentClient client = new PaymentClient();
            PaymentCreateRequest request = PaymentCreateRequest.builder()
                .transactionAmount(order.getTotalAmount())
                .description("Pedido Bairam Burguer #" + order.getId())
                .paymentMethodId("pix")
                .externalReference(order.getId().toString())
                .payer(PaymentPayerRequest.builder()
                    .email(customerEmail)
                    .firstName(order.getCustomerName() != null ? order.getCustomerName() : "Cliente")
                    .lastName("Bairam")
                    .identification(IdentificationRequest.builder()
                        .type("CPF")
                        .number(customerCpf.replaceAll("[^0-9]", ""))
                        .build())
                    .build())
                .build();
            
            Payment payment = client.create(request);
            
            if (payment.getPointOfInteraction() != null && payment.getPointOfInteraction().getTransactionData() != null) {
                response.setPixCopiaECola(payment.getPointOfInteraction().getTransactionData().getQrCode());
                response.setPixQrCodeBase64(payment.getPointOfInteraction().getTransactionData().getQrCodeBase64());
            } else {
                throw new RuntimeException("Falha ao capturar QR Code do Mercado Pago.");
            }
        } catch (MPApiException apiEx) {
            System.err.println("Erro na API do Mercado Pago: " + apiEx.getApiResponse().getContent());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erro no Gateway de Pagamento: " + apiEx.getApiResponse().getContent());
        } catch (MPException mpEx) {
            mpEx.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do Mercado Pago: " + mpEx.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Erro ao processar pagamento Pix: " + e.getMessage());
        }

        return response;
    }
}
