package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.VoucherDto;
import com.tmdt.phone_store_backend.dto.VoucherRequestDto;
import java.util.List;

public interface VoucherService {

    List<VoucherDto> getAllVouchers();

    VoucherDto getVoucherById(Long id);

    VoucherDto createVoucher(VoucherRequestDto request);

    VoucherDto updateVoucher(Long id, VoucherRequestDto request);

    void deleteVoucher(Long id);

    void toggleVoucherActive(Long id, boolean isActive);

    List<VoucherDto> getAvailableVouchers();

    VoucherDto validateByCode(String code);
}
