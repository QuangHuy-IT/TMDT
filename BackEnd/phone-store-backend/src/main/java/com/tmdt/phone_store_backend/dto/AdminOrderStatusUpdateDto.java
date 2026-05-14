package com.tmdt.phone_store_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminOrderStatusUpdateDto {
    @NotBlank(message = "Trạng thái không được để trống")
    private String orderStatus;

    private String note;
}
