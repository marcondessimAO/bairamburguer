package com.bairamburguer.api.repositories.projections;

import java.math.BigDecimal;

public interface PreparationTimeProjection {
    BigDecimal getAverageMinutes();
    Long getSampleSize();
}
