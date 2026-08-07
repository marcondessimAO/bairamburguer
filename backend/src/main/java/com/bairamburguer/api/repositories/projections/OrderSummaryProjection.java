package com.bairamburguer.api.repositories.projections;

import java.math.BigDecimal;

public interface OrderSummaryProjection {
    BigDecimal getRevenue();
    Long getOrderCount();
}
