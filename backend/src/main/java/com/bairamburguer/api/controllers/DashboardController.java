package com.bairamburguer.api.controllers;

import com.bairamburguer.api.dto.DashboardMetricsDTO;
import com.bairamburguer.api.services.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private static final ZoneId STORE_ZONE = ZoneId.of("America/Recife");
    private final DashboardService dashboardService;

    @GetMapping("/metrics")
    public ResponseEntity<DashboardMetricsDTO> getMetrics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate today = LocalDate.now(STORE_ZONE);
        LocalDate start = startDate == null ? YearMonth.from(today).atDay(1) : startDate;
        LocalDate end = endDate == null ? today : endDate;
        if (end.isBefore(start)) {
            throw new ResponseStatusException(BAD_REQUEST, "A data final deve ser igual ou posterior à data inicial.");
        }
        return ResponseEntity.ok(dashboardService.getMetrics(start, end));
    }
}
