package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.UserAddressDto;
import java.util.List;

public interface UserAddressService {

    List<UserAddressDto> getAddressesByUserId(Long userId);

    UserAddressDto createAddress(Long userId, UserAddressDto dto);

    UserAddressDto updateAddress(Long addressId, Long userId, UserAddressDto dto);

    void deleteAddress(Long addressId, Long userId);

    UserAddressDto setDefaultAddress(Long addressId, Long userId);
}
