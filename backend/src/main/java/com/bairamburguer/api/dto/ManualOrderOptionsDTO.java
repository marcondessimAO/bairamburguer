package com.bairamburguer.api.dto;

import com.bairamburguer.api.models.Neighborhood;

import java.util.List;

public record ManualOrderOptionsDTO(List<Neighborhood> neighborhoods) {
}
