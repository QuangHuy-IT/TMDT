package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.OrderItem;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.dto.DashboardStatsDto;
import com.tmdt.phone_store_backend.dto.MonthlyRevenueDto;
import com.tmdt.phone_store_backend.dto.RecentOrderDto;
import com.tmdt.phone_store_backend.dto.TopProductDto;
import com.tmdt.phone_store_backend.repository.OrderRepository;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/dashboard")
@AllArgsConstructor
public class DashboardController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDto> getStats(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime parsedStart;
        LocalDateTime parsedEnd;
        
        try {
            parsedStart = (startDate != null) 
                    ? LocalDateTime.parse(startDate + "T00:00:00")
                    : LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            parsedEnd = (endDate != null) 
                    ? LocalDateTime.parse(endDate + "T23:59:59")
                    : LocalDateTime.now();
        } catch (Exception e) {
            parsedStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
            parsedEnd = LocalDateTime.now();
        }

        final LocalDateTime start = parsedStart;
        final LocalDateTime end = parsedEnd;
        
        // Calculate period length for comparison
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate());
        final LocalDateTime compareStart;
        final LocalDateTime compareEnd;
        
        if (daysBetween <= 1) {
            compareStart = start.minusDays(1);
            compareEnd = start.minusSeconds(1);
        } else if (daysBetween <= 31) {
            compareStart = start.minusDays(daysBetween);
            compareEnd = start.minusSeconds(1);
        } else {
            compareStart = start.minusYears(1);
            compareEnd = end.minusYears(1);
        }

        // Current period stats
        long currentRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED)
                .filter(o -> o.getUpdatedAt() != null 
                        && !o.getUpdatedAt().isBefore(start) 
                        && !o.getUpdatedAt().isAfter(end))
                .mapToLong(o -> o.getTotalAmount().longValue())
                .sum();

        long compareRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED)
                .filter(o -> o.getUpdatedAt() != null 
                        && !o.getUpdatedAt().isBefore(compareStart) 
                        && !o.getUpdatedAt().isAfter(compareEnd))
                .mapToLong(o -> o.getTotalAmount().longValue())
                .sum();

        long currentOrders = orderRepository.findAll().stream()
                .filter(o -> o.getUpdatedAt() != null 
                        && !o.getUpdatedAt().isBefore(start) 
                        && !o.getUpdatedAt().isAfter(end))
                .count();

        long compareOrders = orderRepository.findAll().stream()
                .filter(o -> o.getUpdatedAt() != null 
                        && !o.getUpdatedAt().isBefore(compareStart) 
                        && !o.getUpdatedAt().isAfter(compareEnd))
                .count();

        // Total stats
        long totalRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED)
                .mapToLong(o -> o.getTotalAmount().longValue())
                .sum();
        long totalOrders = orderRepository.count();
        int totalProducts = productRepository.findByDeletedAtIsNullOrderByCreatedAtDesc().size();
        int totalUsers = (int) userRepository.count();
        int pendingOrders = (int) orderRepository.countByOrderStatus(OrderStatus.PENDING);

        double revenueGrowth = compareRevenue > 0 
                ? ((double)(currentRevenue - compareRevenue) / compareRevenue) * 100 
                : 0;

        double ordersGrowth = compareOrders > 0 
                ? ((double)(currentOrders - compareOrders) / compareOrders) * 100 
                : 0;

        DashboardStatsDto stats = DashboardStatsDto.builder()
                .totalRevenue(totalRevenue)
                .totalOrders((int) totalOrders)
                .totalProducts(totalProducts)
                .totalUsers(totalUsers)
                .pendingOrders(pendingOrders)
                .revenueGrowthPercent(Math.round(revenueGrowth * 10) / 10.0)
                .ordersGrowthPercent(Math.round(ordersGrowth * 10) / 10.0)
                .build();

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent-orders")
    public ResponseEntity<List<RecentOrderDto>> getRecentOrders() {
        List<Order> orders = orderRepository.findAllOrderByCreatedAtDesc();
        
        List<RecentOrderDto> recentOrders = orders.stream()
                .limit(10)
                .map(this::toRecentOrderDto)
                .toList();

        return ResponseEntity.ok(recentOrders);
    }

    @GetMapping("/revenue")
    public ResponseEntity<List<MonthlyRevenueDto>> getRevenue(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        LocalDateTime parsedStart;
        LocalDateTime parsedEnd;
        
        try {
            parsedStart = (startDate != null) 
                    ? LocalDateTime.parse(startDate + "T00:00:00")
                    : LocalDateTime.now().minusMonths(6).withDayOfMonth(1);
            parsedEnd = (endDate != null) 
                    ? LocalDateTime.parse(endDate + "T23:59:59")
                    : LocalDateTime.now();
        } catch (Exception e) {
            parsedStart = LocalDateTime.now().minusMonths(6).withDayOfMonth(1);
            parsedEnd = LocalDateTime.now();
        }

        final LocalDateTime start = parsedStart;
        final LocalDateTime end = parsedEnd;

        List<Order> allOrders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED)
                .toList();

        List<Order> filteredOrders = allOrders.stream()
                .filter(o -> o.getUpdatedAt() != null 
                        && !o.getUpdatedAt().isBefore(start) 
                        && !o.getUpdatedAt().isAfter(end))
                .toList();

        List<MonthlyRevenueDto> result = new ArrayList<>();
        
        // Calculate days between
        long daysBetween = java.time.temporal.ChronoUnit.DAYS.between(start.toLocalDate(), end.toLocalDate());
        
        if (daysBetween <= 31) {
            // Daily breakdown
            Map<String, List<Order>> byDay = filteredOrders.stream()
                    .collect(Collectors.groupingBy(o -> {
                        LocalDateTime updatedAt = o.getUpdatedAt() != null ? o.getUpdatedAt() : o.getCreatedAt();
                        return updatedAt.format(DateTimeFormatter.ofPattern("dd/MM"));
                    }));

            for (long i = 0; i <= daysBetween; i++) {
                LocalDateTime day = start.plusDays(i);
                String dayKey = day.format(DateTimeFormatter.ofPattern("dd/MM"));
                final String key = dayKey;
                
                List<Order> dayOrders = byDay.getOrDefault(key, new ArrayList<>());
                result.add(MonthlyRevenueDto.builder()
                        .month(dayKey)
                        .revenue(dayOrders.stream().mapToLong(o -> o.getTotalAmount().longValue()).sum())
                        .orderCount(dayOrders.size())
                        .build());
            }
        } else {
            // Monthly breakdown
            Map<String, List<Order>> byMonth = filteredOrders.stream()
                    .collect(Collectors.groupingBy(o -> {
                        LocalDateTime updatedAt = o.getUpdatedAt() != null ? o.getUpdatedAt() : o.getCreatedAt();
                        return updatedAt.format(DateTimeFormatter.ofPattern("MM/yyyy"));
                    }));

            LocalDateTime current = start;
            while (!current.isAfter(end)) {
                String monthKey = current.format(DateTimeFormatter.ofPattern("MM/yyyy"));
                final String key = monthKey;
                
                List<Order> monthOrders = byMonth.getOrDefault(key, new ArrayList<>());
                result.add(MonthlyRevenueDto.builder()
                        .month(monthKey)
                        .revenue(monthOrders.stream().mapToLong(o -> o.getTotalAmount().longValue()).sum())
                        .orderCount(monthOrders.size())
                        .build());
                
                current = current.plusMonths(1).withDayOfMonth(1);
            }
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductDto>> getTopProducts(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "5") int limit) {
        
        LocalDateTime parsedStart;
        LocalDateTime parsedEnd;
        
        try {
            parsedStart = (startDate != null) 
                    ? LocalDateTime.parse(startDate + "T00:00:00")
                    : LocalDateTime.now().minusMonths(6).withDayOfMonth(1);
            parsedEnd = (endDate != null) 
                    ? LocalDateTime.parse(endDate + "T23:59:59")
                    : LocalDateTime.now();
        } catch (Exception e) {
            parsedStart = LocalDateTime.now().minusMonths(6).withDayOfMonth(1);
            parsedEnd = LocalDateTime.now();
        }

        final LocalDateTime start = parsedStart;
        final LocalDateTime end = parsedEnd;

        // Get delivered orders within date range
        List<Order> deliveredOrders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED)
                .filter(o -> o.getUpdatedAt() != null 
                        && !o.getUpdatedAt().isBefore(start) 
                        && !o.getUpdatedAt().isAfter(end))
                .toList();

        // Group by variant or product name
        Map<String, List<OrderItem>> byProduct = deliveredOrders.stream()
                .flatMap(o -> o.getOrderItems().stream())
                .collect(Collectors.groupingBy(item -> {
                    if (item.getVariant() != null && item.getVariant().getId() != null) {
                        return "VAR_" + item.getVariant().getId();
                    }
                    return "NAME_" + item.getProductNameSnapshot();
                }));

        List<TopProductDto> topProducts = byProduct.entrySet().stream()
                .map(entry -> {
                    List<OrderItem> items = entry.getValue();
                    int totalSold = items.stream().mapToInt(OrderItem::getQuantity).sum();
                    long totalRevenue = items.stream()
                            .mapToLong(item -> item.getLineTotal().longValue())
                            .sum();
                    
                    OrderItem firstItem = items.get(0);
                    String productName = firstItem.getProductNameSnapshot();
                    String image = null;
                    Long variantId = null;
                    Long price = firstItem.getUnitPrice().longValue();
                    
                    if (firstItem.getVariant() != null) {
                        variantId = firstItem.getVariant().getId();
                        Product product = firstItem.getVariant().getProduct();
                        if (product != null && product.getThumbnailUrl() != null) {
                            image = product.getThumbnailUrl();
                        } else if (firstItem.getVariant().getColorImageUrl() != null) {
                            image = firstItem.getVariant().getColorImageUrl();
                        }
                    }

                    return TopProductDto.builder()
                            .variantId(variantId)
                            .productName(productName)
                            .image(image)
                            .price(price)
                            .soldCount(totalSold)
                            .revenue(totalRevenue)
                            .build();
                })
                .sorted(Comparator.comparingLong(TopProductDto::getSoldCount).reversed())
                .limit(limit)
                .toList();

        return ResponseEntity.ok(topProducts);
    }

    private RecentOrderDto toRecentOrderDto(Order o) {
        String customerName = o.getUser() != null ? o.getUser().getFullName() : "Khách vãng lai";
        
        return RecentOrderDto.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .customerName(customerName)
                .totalAmount(o.getTotalAmount().longValue())
                .orderStatus(mapOrderStatus(o.getOrderStatus()))
                .createdAt(o.getCreatedAt() != null ? o.getCreatedAt().format(DTF) : "")
                .build();
    }

    private String mapOrderStatus(OrderStatus status) {
        return switch (status) {
            case PENDING -> "Đang chờ";
            case CONFIRMED -> "Đã xác nhận";
            case PACKING -> "Đang đóng gói";
            case SHIPPING -> "Đang giao";
            case DELIVERED -> "Đã giao";
            case CANCELED -> "Đã hủy";
            case RETURNED -> "Trả hàng";
        };
    }
}
