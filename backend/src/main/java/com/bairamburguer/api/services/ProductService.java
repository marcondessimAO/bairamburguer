package com.bairamburguer.api.services;

import com.bairamburguer.api.models.Product;
import com.bairamburguer.api.repositories.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    public Product alternarDisponibilidade(Long id) {
        // dummy return
        return null;
    }

    public Product atualizarPreco(Long id, float novoPreco) {
        // dummy return
        return null;
    }
}
