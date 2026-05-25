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

    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.paymentStatus = 'PAID' AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    BigDecimal calculateMonthlyRevenue(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus <> 'CANCELLED' AND o.createdAt >= :startDate AND o.createdAt <= :endDate")
    Long countMonthlyOrders(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate, @org.springframework.data.repository.query.Param("endDate") java.time.LocalDateTime endDate);

    @Query("SELECT FUNCTION('TO_CHAR', o.createdAt, 'DD/MM'), SUM(o.totalAmount) " +
           "FROM Order o " +
           "WHERE o.paymentStatus = 'PAID' AND o.createdAt >= :startDate " +
           "GROUP BY FUNCTION('TO_CHAR', o.createdAt, 'DD/MM') " +
           "ORDER BY FUNCTION('TO_CHAR', o.createdAt, 'DD/MM') ASC")
    List<Object[]> getRevenueLast7Days(@org.springframework.data.repository.query.Param("startDate") java.time.LocalDateTime startDate);
}
