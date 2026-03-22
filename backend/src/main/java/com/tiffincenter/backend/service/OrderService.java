package com.tiffincenter.backend.service;

import com.tiffincenter.backend.api.dto.DailySummaryResponse;
import com.tiffincenter.backend.api.dto.OrderItemRequest;
import com.tiffincenter.backend.api.dto.OrderResponse;
import com.tiffincenter.backend.api.dto.PlaceOrderRequest;
import com.tiffincenter.backend.menu.FoodItem;
import com.tiffincenter.backend.menu.FoodItemRepository;
import com.tiffincenter.backend.order.CustomerOrder;
import com.tiffincenter.backend.order.CustomerOrderRepository;
import com.tiffincenter.backend.order.OrderLineItem;
import com.tiffincenter.backend.order.PaymentMethod;
import com.tiffincenter.backend.order.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final FoodItemRepository foodItemRepository;

    public OrderService(CustomerOrderRepository customerOrderRepository, FoodItemRepository foodItemRepository) {
        this.customerOrderRepository = customerOrderRepository;
        this.foodItemRepository = foodItemRepository;
    }

    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        CustomerOrder order = new CustomerOrder();
        order.setCustomerName(request.customerName());
        order.setPhoneNumber(request.phoneNumber());
        order.setPaymentMethod(request.paymentMethod());
        order.setPaymentStatus(request.paymentStatus());
        order.setCreatedAt(LocalDateTime.now());

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.items()) {
            FoodItem foodItem = foodItemRepository.findById(itemRequest.foodItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food item not found: " + itemRequest.foodItemId()));

            OrderLineItem lineItem = new OrderLineItem();
            lineItem.setOrder(order);
            lineItem.setFoodItemId(foodItem.getId());
            lineItem.setFoodItemName(foodItem.getName());
            lineItem.setUnitPrice(foodItem.getPrice());
            lineItem.setQuantity(itemRequest.quantity());
            BigDecimal lineTotal = foodItem.getPrice().multiply(BigDecimal.valueOf(itemRequest.quantity()));
            lineItem.setLineTotal(lineTotal);

            order.getItems().add(lineItem);
            total = total.add(lineTotal);
        }

        order.setTotalAmount(total);
        CustomerOrder savedOrder = customerOrderRepository.save(order);
        return mapOrder(savedOrder);
    }

    public DailySummaryResponse getTodaySummary() {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        List<CustomerOrder> orders = customerOrderRepository.findAllByCreatedAtBetween(start, end);

        BigDecimal totalRevenue = orders.stream()
            .map(CustomerOrder::getTotalAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long paidOrders = orders.stream().filter(order -> order.getPaymentStatus() == PaymentStatus.PAID).count();
        long unpaidOrders = orders.size() - paidOrders;
        Map<String, Long> paymentMethodBreakdown = new LinkedHashMap<>();

        for (PaymentMethod paymentMethod : PaymentMethod.values()) {
            long count = orders.stream().filter(order -> order.getPaymentMethod() == paymentMethod).count();
            paymentMethodBreakdown.put(paymentMethod.name(), count);
        }

        Map<String, DailySummaryResponse.ItemSalesSummary> itemSummaryMap = new LinkedHashMap<>();

        for (CustomerOrder order : orders) {
            for (OrderLineItem item : order.getItems()) {
                DailySummaryResponse.ItemSalesSummary current = itemSummaryMap.get(item.getFoodItemName());
                if (current == null) {
                    itemSummaryMap.put(
                        item.getFoodItemName(),
                        new DailySummaryResponse.ItemSalesSummary(item.getFoodItemName(), item.getQuantity(), item.getLineTotal())
                    );
                } else {
                    itemSummaryMap.put(
                        item.getFoodItemName(),
                        new DailySummaryResponse.ItemSalesSummary(
                            current.itemName(),
                            current.quantitySold() + item.getQuantity(),
                            current.revenue().add(item.getLineTotal())
                        )
                    );
                }
            }
        }

        List<DailySummaryResponse.ItemSalesSummary> topItems = itemSummaryMap.values().stream()
            .sorted(Comparator.comparing(DailySummaryResponse.ItemSalesSummary::quantitySold).reversed())
            .toList();

        return new DailySummaryResponse(orders.size(), totalRevenue, paidOrders, unpaidOrders, paymentMethodBreakdown, topItems);
    }

    private OrderResponse mapOrder(CustomerOrder order) {
        return new OrderResponse(
            order.getId(),
            order.getCustomerName(),
            order.getPhoneNumber(),
            order.getPaymentMethod().name(),
            order.getPaymentStatus().name(),
            order.getTotalAmount(),
            order.getCreatedAt(),
            order.getItems().stream()
                .map(item -> new OrderResponse.OrderResponseItem(
                    item.getFoodItemName(),
                    item.getQuantity(),
                    item.getUnitPrice(),
                    item.getLineTotal()
                ))
                .toList()
        );
    }
}
