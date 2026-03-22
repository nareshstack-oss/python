package com.tiffincenter.backend.menu;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    List<FoodItem> findByAvailableTrueOrderByNameAsc();
}
