package com.bairamburguer.api.repositories;

import com.bairamburguer.api.models.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query(value = "SELECT COALESCE(NULLIF(oi.product_name_snapshot, ''), p.name), SUM(oi.quantity), SUM(oi.subtotal) " +
                   "FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id " +
                   "WHERE o.payment_status = 'PAID' AND UPPER(o.order_status) NOT IN ('CANCELED', 'CANCELLED') " +
                   "AND o.created_at >= :startDate AND o.created_at < :endDate " +
                   "GROUP BY COALESCE(NULLIF(oi.product_name_snapshot, ''), p.name) " +
                   "ORDER BY SUM(oi.quantity) DESC, SUM(oi.subtotal) DESC LIMIT 5", nativeQuery = true)
    List<Object[]> getTopProductsByQuantity(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                                            @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @Query(value = "SELECT COALESCE(NULLIF(oi.product_name_snapshot, ''), p.name), SUM(oi.quantity), SUM(oi.subtotal) " +
                   "FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id " +
                   "WHERE o.payment_status = 'PAID' AND UPPER(o.order_status) NOT IN ('CANCELED', 'CANCELLED') " +
                   "AND o.created_at >= :startDate AND o.created_at < :endDate " +
                   "GROUP BY COALESCE(NULLIF(oi.product_name_snapshot, ''), p.name) " +
                   "ORDER BY SUM(oi.subtotal) DESC, SUM(oi.quantity) DESC LIMIT 5", nativeQuery = true)
    List<Object[]> getTopProductsByRevenue(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                                           @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @Query(value = "SELECT COALESCE(NULLIF(oi.product_name_snapshot, ''), p.name), SUM(oi.quantity), SUM(oi.subtotal) " +
                   "FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id " +
                   "WHERE p.is_available = TRUE AND o.payment_status = 'PAID' " +
                   "AND UPPER(o.order_status) NOT IN ('CANCELED', 'CANCELLED') " +
                   "AND o.created_at >= :startDate AND o.created_at < :endDate " +
                   "GROUP BY COALESCE(NULLIF(oi.product_name_snapshot, ''), p.name) HAVING SUM(oi.quantity) > 0 " +
                   "ORDER BY SUM(oi.quantity) ASC, SUM(oi.subtotal) ASC LIMIT 5", nativeQuery = true)
    List<Object[]> getLeastSoldActiveProducts(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                                               @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);
}
