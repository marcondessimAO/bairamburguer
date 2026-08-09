package com.bairamburguer.api.controllers;

import com.bairamburguer.api.dto.DashboardMetricsDTO;
import com.bairamburguer.api.services.DashboardService;
import com.bairamburguer.api.security.CustomUserDetailsService;
import com.bairamburguer.api.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.ArgumentMatchers.any;

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

    @BeforeEach
    void forwardThroughMockedJwtFilter() throws Exception {
        doAnswer(invocation -> {
            jakarta.servlet.FilterChain chain = invocation.getArgument(2);
            chain.doFilter(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());
    }

    @Test
    void metricsEndpointRejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard/metrics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void metricsEndpointReturnsOkForAnAuthenticatedAdmin() throws Exception {
        LocalDate day = LocalDate.of(2026, 8, 9);
        DashboardMetricsDTO metrics = new DashboardMetricsDTO(
                new DashboardMetricsDTO.PeriodDTO(day, day, "hour"),
                new DashboardMetricsDTO.SummaryDTO(BigDecimal.ZERO, 0, 0, BigDecimal.ZERO),
                new DashboardMetricsDTO.ComparisonDTO(null, null, null),
                List.of(), new DashboardMetricsDTO.PreparationTimeDTO(null, 0),
                List.of(new DashboardMetricsDTO.SalesPointDTO(
                        OffsetDateTime.parse("2026-08-09T00:00:00-03:00"), BigDecimal.ZERO, 0)),
                new DashboardMetricsDTO.ProductRankingsDTO(List.of(), List.of(), List.of()));
        when(dashboardService.getMetrics(day, day)).thenReturn(metrics);

        mockMvc.perform(get("/api/v1/admin/dashboard/metrics")
                        .param("startDate", "2026-08-09")
                        .param("endDate", "2026-08-09"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.period.granularity").value("hour"))
                .andExpect(jsonPath("$.salesEvolution[0].timestamp").value("2026-08-09T00:00:00-03:00"));
    }
}
