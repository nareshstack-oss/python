package com.tiffincenter.backend.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record FoodItemRequest(
    @NotBlank String name,
    @NotBlank String description,
    @NotNull @DecimalMin("0.0") BigDecimal price,
    boolean available
) {
}
