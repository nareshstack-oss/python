package com.tiffincenter.backend.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
    Long orderId,
    String customerName,
    String phoneNumber,
    String paymentMethod,
    String paymentStatus,
    BigDecimal totalAmount,
    LocalDateTime createdAt,
    List<OrderResponseItem> items
) {
    public record OrderResponseItem(
        String foodItemName,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
    ) {
    }
}
