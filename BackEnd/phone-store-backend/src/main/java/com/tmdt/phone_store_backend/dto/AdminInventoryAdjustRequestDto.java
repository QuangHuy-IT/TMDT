package com.tmdt.phone_store_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminInventoryAdjustRequestDto {

    @NotEmpty(message = "Danh sách thay đổi không được trống")
    @Valid
    private List<AdminInventoryAdjustItemRequestDto> changes;

    private String note;
}
