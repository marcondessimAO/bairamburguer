package com.bairamburguer.api.controllers;

import com.bairamburguer.api.dto.DashboardMetricsDTO;
import com.bairamburguer.api.services.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DashboardControllerTest {
    @Test
    void rejectsAnInvalidDateRange() {
        DashboardController controller = new DashboardController(mock(DashboardService.class));

        assertThatThrownBy(() -> controller.getMetrics(LocalDate.of(2026, 8, 2), LocalDate.of(2026, 8, 1)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("data final");
    }

    @Test
    void returnsMetricsForTheExactRequestedPeriod() {
        DashboardService service = mock(DashboardService.class);
        LocalDate start = LocalDate.of(2026, 8, 1);
        LocalDate end = LocalDate.of(2026, 8, 7);
        DashboardMetricsDTO metrics = new DashboardMetricsDTO(
                new DashboardMetricsDTO.PeriodDTO(start, end),
                new DashboardMetricsDTO.SummaryDTO(BigDecimal.ZERO, 0, BigDecimal.ZERO),
                new DashboardMetricsDTO.ComparisonDTO(null, null, null),
                List.of(), new DashboardMetricsDTO.PreparationTimeDTO(null, 0),
                List.of(), new DashboardMetricsDTO.ProductRankingsDTO(List.of(), List.of(), List.of()));
        when(service.getMetrics(start, end)).thenReturn(metrics);

        ResponseEntity<DashboardMetricsDTO> response = new DashboardController(service).getMetrics(start, end);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isSameAs(metrics);
        verify(service).getMetrics(start, end);
    }
}
