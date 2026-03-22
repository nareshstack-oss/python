package com.tiffincenter.backend.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record DailySummaryResponse(
    long totalOrders,
    BigDecimal totalRevenue,
    long paidOrders,
    long unpaidOrders,
    List<ItemSalesSummary> topItems
) {
    public record ItemSalesSummary(
        String itemName,
        int quantitySold,
        BigDecimal revenue
    ) {
    }
}
