package com.bairamburguer.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class CorsDiagnosticsFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(CorsDiagnosticsFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        boolean shouldLog = request.getHeader("Origin") != null
                || request.getRequestURI().startsWith("/api/v1/admin/orders");

        if (shouldLog) {
            log.info(
                    "CORS diagnostic incoming method={} path={} origin={} acrMethod={} acrHeaders={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    request.getHeader("Origin"),
                    request.getHeader("Access-Control-Request-Method"),
                    request.getHeader("Access-Control-Request-Headers")
            );
        }

        filterChain.doFilter(request, response);

        if (shouldLog) {
            log.info(
                    "CORS diagnostic outgoing method={} path={} status={} allowOrigin={} allowMethods={} allowHeaders={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    response.getHeader("Access-Control-Allow-Origin"),
                    response.getHeader("Access-Control-Allow-Methods"),
                    response.getHeader("Access-Control-Allow-Headers")
            );
        }
    }
}
