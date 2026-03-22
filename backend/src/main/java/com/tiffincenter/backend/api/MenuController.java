package com.tiffincenter.backend.api;

import com.tiffincenter.backend.menu.FoodItem;
import com.tiffincenter.backend.service.MenuService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menu")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public List<FoodItem> getMenu() {
        return menuService.getAvailableMenu();
    }
}
