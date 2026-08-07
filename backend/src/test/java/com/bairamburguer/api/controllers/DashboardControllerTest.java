package com.bairamburguer.api.controllers;

import com.bairamburguer.api.services.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;

class DashboardControllerTest {
    @Test
    void rejectsAnInvalidDateRange() {
        DashboardController controller = new DashboardController(mock(DashboardService.class));

        assertThatThrownBy(() -> controller.getMetrics(LocalDate.of(2026, 8, 2), LocalDate.of(2026, 8, 1)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("data final");
    }
}
