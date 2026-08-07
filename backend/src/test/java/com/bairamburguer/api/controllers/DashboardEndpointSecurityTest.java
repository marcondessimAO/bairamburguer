package com.bairamburguer.api.controllers;

import com.bairamburguer.api.services.DashboardService;
import com.bairamburguer.api.security.CustomUserDetailsService;
import com.bairamburguer.api.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
class DashboardEndpointSecurityTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @Test
    void metricsEndpointRejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/metrics"))
                .andExpect(status().isUnauthorized());
    }
}
