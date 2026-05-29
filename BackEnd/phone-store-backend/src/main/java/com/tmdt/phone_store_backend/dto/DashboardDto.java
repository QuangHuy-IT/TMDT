package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardDto {
    private DashboardStatsDto stats;
    private List<RecentOrderDto> recentOrders;
    private List<MonthlyRevenueDto> monthlyRevenue;
}
