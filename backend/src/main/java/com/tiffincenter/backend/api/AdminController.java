package com.tiffincenter.backend.api;

import com.tiffincenter.backend.api.dto.AdminLoginRequest;
import com.tiffincenter.backend.api.dto.AdminLoginResponse;
import com.tiffincenter.backend.api.dto.DailySummaryResponse;
import com.tiffincenter.backend.api.dto.FoodItemRequest;
import com.tiffincenter.backend.menu.FoodItem;
import com.tiffincenter.backend.service.AdminService;
import com.tiffincenter.backend.service.MenuService;
import com.tiffincenter.backend.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final MenuService menuService;
    private final OrderService orderService;

    public AdminController(AdminService adminService, MenuService menuService, OrderService orderService) {
        this.adminService = adminService;
        this.menuService = menuService;
        this.orderService = orderService;
    }

    @PostMapping("/login")
    public AdminLoginResponse login(@Valid @RequestBody AdminLoginRequest request) {
        return adminService.login(request);
    }

    @GetMapping("/items")
    public List<FoodItem> getItems() {
        return menuService.getAllItems();
    }

    @PostMapping("/items")
    public FoodItem createItem(@Valid @RequestBody FoodItemRequest request) {
        return menuService.createItem(request);
    }

    @PutMapping("/items/{id}")
    public FoodItem updateItem(@PathVariable Long id, @Valid @RequestBody FoodItemRequest request) {
        return menuService.updateItem(id, request);
    }

    @GetMapping("/summary/today")
    public DailySummaryResponse getTodaySummary() {
        return orderService.getTodaySummary();
    }
}
