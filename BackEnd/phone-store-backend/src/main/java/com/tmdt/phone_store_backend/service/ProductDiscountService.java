package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.*;
import java.util.List;

public interface ProductDiscountService {

    List<ProductDiscountDto> getAllDiscounts();
    List<ProductDiscountDto> getActiveDiscounts();
    ProductDiscountDto getDiscountById(Long id);
    ProductDiscountDto createDiscount(CreateDiscountRequestDto request);
    ProductDiscountDto updateDiscount(Long id, UpdateDiscountRequestDto request);
    void deleteDiscount(Long id);
    void toggleDiscount(Long id);
}
