package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.ProductDiscount;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.dto.*;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.ProductDiscountRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import com.tmdt.phone_store_backend.service.ProductDiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductDiscountServiceImpl implements ProductDiscountService {

    private final ProductDiscountRepository discountRepository;
    private final ProductVariantRepository variantRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProductDiscountDto> getAllDiscounts() {
        return discountRepository.findAllWithDetails().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDiscountDto> getActiveDiscounts() {
        return discountRepository.findAllActiveNow(LocalDateTime.now()).stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDiscountDto getDiscountById(Long id) {
        ProductDiscount discount = discountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục giảm giá: " + id));
        return toDto(discount);
    }

    @Override
    @Transactional
    public ProductDiscountDto createDiscount(CreateDiscountRequestDto request) {
        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản sản phẩm."));

        if (request.getEndAt().isBefore(request.getStartAt())) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
        }

        BigDecimal originalPrice = variant.getPrice();
        Integer savedPercent = request.getDiscountPercent();
        BigDecimal savedAmount = request.getDiscountAmount();

        // Nếu chỉ nhập số tiền (giá sau giảm) → tự tính percent tương ứng
        if (savedAmount != null && savedAmount.compareTo(BigDecimal.ZERO) > 0
                && (savedPercent == null || savedPercent <= 0)) {
            // savedAmount = giá SAU GIẢM → tính số tiền đã giảm
            BigDecimal diff = originalPrice.subtract(savedAmount);
            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                // tính % làm tròn từ số tiền đã giảm
                savedPercent = diff.multiply(BigDecimal.valueOf(100))
                        .divide(originalPrice, 0, RoundingMode.HALF_UP).intValue();
                // lưu số tiền đã giảm (không phải giá sau giảm)
                savedAmount = diff;
            }
        }

        ProductDiscount discount = ProductDiscount.builder()
                .variant(variant)
                .discountPercent(savedPercent)
                .discountAmount(savedAmount)
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        ProductDiscount saved = discountRepository.save(discount);
        return toDto(saved);
    }

    @Override
    @Transactional
    public ProductDiscountDto updateDiscount(Long id, UpdateDiscountRequestDto request) {
        ProductDiscount discount = discountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục giảm giá: " + id));

        ProductVariant variant = discount.getVariant();
        BigDecimal originalPrice = variant.getPrice();

        if (request.getDiscountPercent() != null) {
            discount.setDiscountPercent(request.getDiscountPercent());
            discount.setDiscountAmount(null);
        }
        if (request.getDiscountAmount() != null) {
            // request.discountAmount = giá SAU GIẢM → tính số tiền đã giảm
            BigDecimal afterPrice = request.getDiscountAmount();
            BigDecimal diff = originalPrice.subtract(afterPrice);
            if (diff.compareTo(BigDecimal.ZERO) > 0) {
                discount.setDiscountAmount(diff);
                discount.setDiscountPercent(
                    diff.multiply(BigDecimal.valueOf(100))
                       .divide(originalPrice, 0, RoundingMode.HALF_UP).intValue()
                );
            } else {
                discount.setDiscountAmount(null);
            }
        }
        if (request.getStartAt() != null) {
            discount.setStartAt(request.getStartAt());
        }
        if (request.getEndAt() != null) {
            discount.setEndAt(request.getEndAt());
        }
        if (request.getIsActive() != null) {
            discount.setIsActive(request.getIsActive());
        }
        discount.setUpdatedAt(LocalDateTime.now());

        ProductDiscount saved = discountRepository.save(discount);
        return toDto(saved);
    }

    @Override
    @Transactional
    public void deleteDiscount(Long id) {
        if (!discountRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy mục giảm giá: " + id);
        }
        discountRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void toggleDiscount(Long id) {
        ProductDiscount discount = discountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục giảm giá: " + id));
        discount.setIsActive(!discount.getIsActive());
        discount.setUpdatedAt(LocalDateTime.now());
        discountRepository.save(discount);
    }

    private String getStatus(ProductDiscount discount) {
        LocalDateTime now = LocalDateTime.now();
        if (discount.getEndAt().isBefore(now)) return "ENDED";
        if (discount.getStartAt().isAfter(now)) return "UPCOMING";
        return "ACTIVE";
    }

    private ProductDiscountDto toDto(ProductDiscount discount) {
        ProductVariant variant = discount.getVariant();
        BigDecimal originalPrice = variant.getPrice();
        BigDecimal discountPrice = originalPrice;
        BigDecimal discountSavedAmount = BigDecimal.ZERO;

        // discountAmount = SỐ TIỀN GIẢM TRỰC TIẾP (admin nhập bao nhiêu thì giảm bấy nhiêu)
        if (discount.getDiscountAmount() != null && discount.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discountSavedAmount = discount.getDiscountAmount().min(originalPrice);
            discountPrice = originalPrice.subtract(discountSavedAmount);
            if (discountPrice.compareTo(BigDecimal.ZERO) < 0) discountPrice = BigDecimal.ZERO;
        } else if (discount.getDiscountPercent() != null && discount.getDiscountPercent() > 0) {
            discountSavedAmount = originalPrice.multiply(
                    BigDecimal.valueOf(discount.getDiscountPercent())
            ).divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
            discountPrice = originalPrice.subtract(discountSavedAmount);
            if (discountPrice.compareTo(BigDecimal.ZERO) < 0) discountPrice = BigDecimal.ZERO;
        }

        String ramLabel = variant.getRamGb() != null ? variant.getRamGb() + "GB RAM" : null;

        return ProductDiscountDto.builder()
                .id(discount.getId())
                .variantId(variant.getId())
                .productId(variant.getProduct().getId())
                .productName(variant.getProduct().getName())
                .productSlug(variant.getProduct().getSlug())
                .variantSku(variant.getSku())
                .color(variant.getColor())
                .ramLabel(ramLabel)
                .storageLabel(variant.getStorageLabel() != null ? variant.getStorageLabel() : (variant.getStorageGb() != null ? variant.getStorageGb() + "GB" : null))
                .originalPrice(originalPrice)
                .discountPercent(discount.getDiscountPercent())
                .discountAmount(discountSavedAmount)
                .discountPrice(discountPrice)
                .startAt(discount.getStartAt())
                .endAt(discount.getEndAt())
                .isActive(discount.getIsActive())
                .status(getStatus(discount))
                .build();
    }
}
