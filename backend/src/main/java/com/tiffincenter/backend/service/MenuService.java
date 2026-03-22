package com.tiffincenter.backend.service;

import com.tiffincenter.backend.api.dto.FoodItemRequest;
import com.tiffincenter.backend.menu.FoodItem;
import com.tiffincenter.backend.menu.FoodItemRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class MenuService {

    private final FoodItemRepository foodItemRepository;

    public MenuService(FoodItemRepository foodItemRepository) {
        this.foodItemRepository = foodItemRepository;
    }

    public List<FoodItem> getAvailableMenu() {
        return foodItemRepository.findByAvailableTrueOrderByNameAsc();
    }

    public List<FoodItem> getAllItems() {
        return foodItemRepository.findAll();
    }

    public FoodItem createItem(FoodItemRequest request) {
        FoodItem item = new FoodItem();
        apply(item, request);
        return foodItemRepository.save(item);
    }

    public FoodItem updateItem(Long id, FoodItemRequest request) {
        FoodItem item = foodItemRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food item not found"));
        apply(item, request);
        return foodItemRepository.save(item);
    }

    private void apply(FoodItem item, FoodItemRequest request) {
        item.setName(request.name());
        item.setDescription(request.description());
        item.setPrice(request.price());
        item.setAvailable(request.available());
    }
}
