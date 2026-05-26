package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalRevenue;
    private int totalOrders;
    private int totalProducts;
    private int totalUsers;
    private int pendingOrders;
    private double revenueGrowthPercent;
    private double ordersGrowthPercent;
}
