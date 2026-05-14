package com.tmdt.phone_store_backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AdminOrderDetailDto extends AdminOrderDto {
    private List<AdminOrderItemDto> items;
}
