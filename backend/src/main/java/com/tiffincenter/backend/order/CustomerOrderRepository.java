package com.tiffincenter.backend.order;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findAllByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
