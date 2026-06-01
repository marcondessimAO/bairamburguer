package com.bairamburguer.api.config;

import com.bairamburguer.api.security.CustomUserDetailsService;
import com.bairamburguer.api.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class SecurityConfigTest {

    @Test
    void corsAllowsPatchForAdminStatusUpdates() {
        SecurityConfig config = new SecurityConfig(
                mock(JwtAuthenticationFilter.class),
                mock(CustomUserDetailsService.class)
        );

        CorsConfiguration cors = config.corsConfigurationSource().getCorsConfiguration(new MockHttpServletRequest());

        assertThat(cors).isNotNull();
        assertThat(cors.getAllowedMethods()).contains("PATCH");
    }

    @Test
    void corsAllowsProductionPatchPreflightWithAuthorizationHeader() {
        SecurityConfig config = new SecurityConfig(
                mock(JwtAuthenticationFilter.class),
                mock(CustomUserDetailsService.class)
        );

        CorsConfiguration cors = config.corsConfigurationSource().getCorsConfiguration(new MockHttpServletRequest());

        assertThat(cors).isNotNull();
        assertThat(cors.getAllowedOrigins()).contains(
                "https://bairamburguerpetiscaria.com",
                "https://www.bairamburguerpetiscaria.com"
        );
        assertThat(cors.checkOrigin("https://bairamburguerpetiscaria.com"))
                .isEqualTo("https://bairamburguerpetiscaria.com");
        assertThat(cors.checkHttpMethod(HttpMethod.PATCH)).contains(HttpMethod.PATCH);
        assertThat(cors.checkHeaders(java.util.List.of("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With")))
                .containsExactlyInAnyOrder("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With");
        assertThat(cors.getAllowedHeaders()).doesNotContain("*");
        assertThat(cors.getAllowCredentials()).isTrue();
    }
}
