package com.tiffincenter.backend.api;

import com.tiffincenter.backend.api.dto.OrderResponse;
import com.tiffincenter.backend.api.dto.PlaceOrderRequest;
import com.tiffincenter.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse placeOrder(@Valid @RequestBody PlaceOrderRequest request) {
        return orderService.placeOrder(request);
    }
}
