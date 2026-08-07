package com.bairamburguer.api.controllers;

import com.bairamburguer.api.config.SecurityConfig;
import com.bairamburguer.api.security.CustomUserDetailsService;
import com.bairamburguer.api.security.JwtAuthenticationFilter;
import com.bairamburguer.api.services.OrderService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

@WebMvcTest(AdminOrderController.class)
@Import(SecurityConfig.class)
class AdminManualOrderEndpointSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    private static final String VALID_BODY = """
            {"customerName":"Cliente","customerPhone":"83999999999","deliveryMode":"RETIRADA",
             "paymentMethod":"DINHEIRO","items":[{"product":10,"quantity":1,"addonIds":[]}]}
            """;

    @BeforeEach
    void forwardThroughMockedJwtFilter() throws Exception {
        doAnswer(invocation -> {
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    void rejectsUnauthenticatedManualOrderCreation() throws Exception {
        mockMvc.perform(post("/api/v1/admin/orders/manual")
                        .with(csrf())
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = "USER")
    void rejectsNonAdminManualOrderCreation() throws Exception {
        mockMvc.perform(post("/api/v1/admin/orders/manual")
                        .with(csrf())
                        .contentType("application/json").content(VALID_BODY))
                .andExpect(status().isForbidden());
    }

    @Test
    void rejectsUnauthenticatedCancellation() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/orders/41/cancel").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = "USER")
    void rejectsNonAdminCancellation() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/orders/41/cancel").with(csrf()))
                .andExpect(status().isForbidden());
    }
}
