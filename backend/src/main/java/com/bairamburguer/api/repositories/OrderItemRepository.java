package com.bairamburguer.api.repositories;

import com.bairamburguer.api.models.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query(value = "SELECT p.name as productName, SUM(oi.quantity) as totalQuantity, SUM(oi.subtotal) as totalRevenue " +
                   "FROM order_items oi " +
                   "JOIN products p ON oi.product_id = p.id " +
                   "JOIN orders o ON oi.order_id = o.id " +
                   "WHERE o.order_status <> 'CANCELLED' " +
                   "GROUP BY p.id, p.name " +
                   "ORDER BY totalQuantity DESC " +
                   "LIMIT 5", nativeQuery = true)
    List<Object[]> getTop5Products();
}
