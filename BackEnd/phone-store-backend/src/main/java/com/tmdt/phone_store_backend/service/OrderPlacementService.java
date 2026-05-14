package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.Voucher;
import com.tmdt.phone_store_backend.dto.CreateOrderRequestDto;
import com.tmdt.phone_store_backend.dto.OrderDto;

public interface OrderPlacementService {

    OrderDto createOrder(CreateOrderRequestDto request);

    OrderDto createOrderAndReturnDto(CreateOrderRequestDto request);

    void updatePaymentStatus(Long orderId, String paymentStatus);
}
