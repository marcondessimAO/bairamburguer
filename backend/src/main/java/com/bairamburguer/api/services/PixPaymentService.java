package com.bairamburguer.api.services;

import com.bairamburguer.api.dto.OrderCheckoutResponseDTO;
import com.bairamburguer.api.models.Order;
import org.springframework.stereotype.Service;

import java.util.Base64;

@Service
public class PixPaymentService {

    /**
     * Simula a comunicação com o Gateway Efí (Gerencianet) para gerar uma cobrança Pix.
     */
    public OrderCheckoutResponseDTO generatePixCharge(Order order) {
        OrderCheckoutResponseDTO response = new OrderCheckoutResponseDTO();
        response.setOrderId(order.getId());
        response.setTotalAmount(order.getTotalAmount());
        
        // Dados fictícios simulando o retorno da API do Efí
        String mockQrCode = "00020101021226580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426655440000520400005303986540510.005802BR5913Bairamburguer6008BRASILIA62070503***6304ABCD";
        String mockBase64 = Base64.getEncoder().encodeToString(mockQrCode.getBytes());
        
        response.setPixCopiaECola(mockQrCode);
        response.setPixQrCodeBase64(mockBase64);

        return response;
    }
}
