package com.tiffincenter.backend.api.dto;

import com.tiffincenter.backend.order.PaymentStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record PlaceOrderRequest(
    @NotBlank String customerName,
    @NotBlank String phoneNumber,
    @NotNull PaymentStatus paymentStatus,
    @NotEmpty List<@Valid OrderItemRequest> items
) {
}
