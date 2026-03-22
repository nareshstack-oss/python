package com.tiffincenter.backend.config;

import com.tiffincenter.backend.menu.FoodItem;
import com.tiffincenter.backend.menu.FoodItemRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedMenu(FoodItemRepository repository) {
        return args -> {
            if (repository.count() > 0) {
                return;
            }

            repository.saveAll(List.of(
                create("Idli Plate", "Soft idli with chutney and sambar", "60"),
                create("Masala Dosa", "Crispy dosa with potato masala", "110"),
                create("Poori Bhaji", "Poori with potato curry", "95"),
                create("Veg Meals", "Rice, dal, curry, roti and curd", "150")
            ));
        };
    }

    private FoodItem create(String name, String description, String price) {
        FoodItem item = new FoodItem();
        item.setName(name);
        item.setDescription(description);
        item.setPrice(new BigDecimal(price));
        item.setAvailable(true);
        return item;
    }
}
