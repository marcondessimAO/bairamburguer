package com.bairamburguer.api.repositories;

import com.bairamburguer.api.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerId(Long customerId);
    List<Order> findAllByOrderByCreatedAtAsc();

    @Query("SELECT o FROM Order o WHERE o.source = com.bairamburguer.api.models.OrderSource.MANUAL " +
           "OR o.paymentStatus = 'PAID' ORDER BY o.createdAt ASC")
    List<Order> findOperationalOrders();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0), COUNT(o) FROM Order o " +
           "WHERE o.paymentStatus = 'PAID' AND UPPER(o.orderStatus) NOT IN ('CANCELED', 'CANCELLED') " +
           "AND o.createdAt >= :startDate AND o.createdAt < :endDate")
    Object[] getValidOrderSummary(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                                  @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @Query("SELECT o.orderStatus, COUNT(o) FROM Order o WHERE o.createdAt >= :startDate AND o.createdAt < :endDate GROUP BY o.orderStatus")
    List<Object[]> countOrdersByStatus(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                                       @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @Query(value = "SELECT date_trunc(:bucket, o.created_at), COALESCE(SUM(o.total_amount), 0), COUNT(o) " +
           "FROM orders o WHERE o.payment_status = 'PAID' AND UPPER(o.order_status) NOT IN ('CANCELED', 'CANCELLED') " +
           "AND o.created_at >= :startDate AND o.created_at < :endDate " +
           "GROUP BY date_trunc(:bucket, o.created_at) ORDER BY date_trunc(:bucket, o.created_at)", nativeQuery = true)
    List<Object[]> getSalesEvolution(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                                     @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate,
                                     @org.springframework.data.repository.query.Param("bucket") String bucket);

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (o.ready_at - o.production_started_at)) / 60.0), COUNT(o) " +
           "FROM orders o WHERE o.production_started_at IS NOT NULL AND o.ready_at IS NOT NULL " +
           "AND o.ready_at >= :startDate AND o.ready_at < :endDate AND o.ready_at >= o.production_started_at", nativeQuery = true)
    Object[] getAveragePreparationTime(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate,
                                       @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);
}
