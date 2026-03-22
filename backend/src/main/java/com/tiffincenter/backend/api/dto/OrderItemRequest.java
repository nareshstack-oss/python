package com.tiffincenter.backend.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record OrderItemRequest(
    @NotNull Long foodItemId,
    @Min(1) int quantity
) {
}
