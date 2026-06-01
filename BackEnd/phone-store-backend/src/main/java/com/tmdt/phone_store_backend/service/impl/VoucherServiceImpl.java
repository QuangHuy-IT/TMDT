package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.Voucher;
import com.tmdt.phone_store_backend.domain.enums.VoucherDiscountType;
import com.tmdt.phone_store_backend.dto.VoucherDto;
import com.tmdt.phone_store_backend.dto.VoucherRequestDto;
import com.tmdt.phone_store_backend.exception.BadRequestException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.VoucherRepository;
import com.tmdt.phone_store_backend.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoucherServiceImpl implements VoucherService {

    private final VoucherRepository voucherRepository;

    private VoucherDto toDto(Voucher v) {
        return VoucherDto.builder()
                .id(v.getId())
                .code(v.getCode())
                .discountType(v.getDiscountType().name())
                .discountValue(v.getDiscountValue())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .minOrderAmount(v.getMinOrderAmount())
                .startAt(v.getStartAt())
                .endAt(v.getEndAt())
                .usageLimit(v.getUsageLimit())
                .usedCount(v.getUsedCount())
                .isActive(v.getIsActive())
                .createdAt(v.getCreatedAt())
                .build();
    }

    @Override
    public List<VoucherDto> getAllVouchers() {
        return voucherRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public VoucherDto getVoucherById(Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found with id: " + id));
        return toDto(v);
    }

    @Override
    @Transactional
    public VoucherDto createVoucher(VoucherRequestDto req) {
        if (voucherRepository.existsByCode(req.getCode())) {
            throw new BadRequestException("Mã voucher '" + req.getCode() + "' đã tồn tại");
        }

        validateDateRange(req.getStartAt(), req.getEndAt());
        validateDiscountType(req.getDiscountType(), req.getDiscountValue());

        Voucher v = new Voucher();
        v.setCode(req.getCode().toUpperCase().trim());
        v.setDiscountType(VoucherDiscountType.valueOf(req.getDiscountType()));
        v.setDiscountValue(req.getDiscountValue());
        v.setMaxDiscountAmount(req.getMaxDiscountAmount());
        v.setMinOrderAmount(req.getMinOrderAmount());
        v.setStartAt(req.getStartAt());
        v.setEndAt(req.getEndAt());
        v.setUsageLimit(req.getUsageLimit());
        v.setUsedCount(0);
        v.setIsActive(req.getIsActive() != null ? req.getIsActive() : true);
        v.setCreatedAt(LocalDateTime.now());
        v.setUpdatedAt(LocalDateTime.now());

        return toDto(voucherRepository.save(v));
    }

    @Override
    @Transactional
    public VoucherDto updateVoucher(Long id, VoucherRequestDto req) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found with id: " + id));

        if (!v.getCode().equalsIgnoreCase(req.getCode())
                && voucherRepository.existsByCode(req.getCode())) {
            throw new BadRequestException("Mã voucher '" + req.getCode() + "' đã tồn tại");
        }

        validateDateRange(req.getStartAt(), req.getEndAt());
        validateDiscountType(req.getDiscountType(), req.getDiscountValue());

        v.setCode(req.getCode().toUpperCase().trim());
        v.setDiscountType(VoucherDiscountType.valueOf(req.getDiscountType()));
        v.setDiscountValue(req.getDiscountValue());
        v.setMaxDiscountAmount(req.getMaxDiscountAmount());
        v.setMinOrderAmount(req.getMinOrderAmount());
        v.setStartAt(req.getStartAt());
        v.setEndAt(req.getEndAt());
        v.setUsageLimit(req.getUsageLimit());
        v.setIsActive(req.getIsActive() != null ? req.getIsActive() : v.getIsActive());
        v.setUpdatedAt(LocalDateTime.now());

        return toDto(voucherRepository.save(v));
    }

    @Override
    @Transactional
    public void deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            throw new ResourceNotFoundException("Voucher not found with id: " + id);
        }
        voucherRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void toggleVoucherActive(Long id, boolean isActive) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher not found with id: " + id));
        v.setIsActive(isActive);
        v.setUpdatedAt(LocalDateTime.now());
        voucherRepository.save(v);
    }

    @Override
    public List<VoucherDto> getAvailableVouchers() {
        LocalDateTime now = LocalDateTime.now();
        return voucherRepository.findAll().stream()
                .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                .filter(v -> v.getEndAt() == null || !now.isAfter(v.getEndAt()))
                .filter(v -> v.getStartAt() == null || !now.isBefore(v.getStartAt()))
                .filter(v -> v.getUsageLimit() == null || v.getUsedCount() == null
                        || v.getUsedCount() < v.getUsageLimit())
                .map(this::toDto)
                .toList();
    }

    @Override
    public VoucherDto validateByCode(String code, BigDecimal subtotal) {
        String normalized = code.trim().toUpperCase();
        Voucher v = voucherRepository.findByCode(normalized)
                .orElseThrow(() -> new ResourceNotFoundException("Mã voucher không tồn tại"));

        if (Boolean.FALSE.equals(v.getIsActive())) {
            throw new BadRequestException("Mã voucher đã bị vô hiệu hóa");
        }
        LocalDateTime now = LocalDateTime.now();
        if (v.getStartAt() != null && now.isBefore(v.getStartAt())) {
            throw new BadRequestException("Mã voucher chưa đến thời gian sử dụng");
        }
        if (v.getEndAt() != null && now.isAfter(v.getEndAt())) {
            throw new BadRequestException("Mã voucher đã hết hạn");
        }
        if (v.getUsageLimit() != null && v.getUsedCount() != null
                && v.getUsedCount() >= v.getUsageLimit()) {
            throw new BadRequestException("Mã voucher đã hết lượt sử dụng");
        }
        if (v.getMinOrderAmount() != null && subtotal != null
                && subtotal.compareTo(v.getMinOrderAmount()) < 0) {
            throw new BadRequestException("Đơn hàng phải có giá trị tối thiểu "
                    + v.getMinOrderAmount().longValue() + "đ để sử dụng voucher này");
        }
        return toDto(v);
    }

    private void validateDateRange(LocalDateTime start, LocalDateTime end) {
        if (end.isBefore(start)) {
            throw new BadRequestException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
    }

    private void validateDiscountType(String type, java.math.BigDecimal value) {
        VoucherDiscountType discountType;
        try {
            discountType = VoucherDiscountType.valueOf(type);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Loại giảm giá không hợp lệ. Chỉ chấp nhận: PERCENT, FIXED");
        }

        if (discountType == VoucherDiscountType.PERCENT) {
            if (value.doubleValue() <= 0 || value.doubleValue() > 100) {
                throw new BadRequestException("Phần trăm giảm giá phải từ 0.01 đến 100");
            }
        }
    }
}
