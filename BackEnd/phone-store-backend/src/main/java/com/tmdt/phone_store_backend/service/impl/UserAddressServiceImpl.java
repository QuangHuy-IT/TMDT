package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.entity.UserAddress;
import com.tmdt.phone_store_backend.dto.UserAddressDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.UserAddressRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.service.UserAddressService;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@AllArgsConstructor
@Transactional
public class UserAddressServiceImpl implements UserAddressService {

    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;

    @Override
    public List<UserAddressDto> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public UserAddressDto createAddress(Long userId, UserAddressDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));

        if (dto.getIsDefault() != null && dto.getIsDefault()) {
            addressRepository.clearDefaultForUser(userId);
        }

        LocalDateTime now = LocalDateTime.now();
        UserAddress entity = new UserAddress();
        entity.setUser(user);
        applyDtoToEntity(entity, dto);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        UserAddress saved = addressRepository.save(entity);
        log.info("Created address id={} for user id={}", saved.getId(), userId);
        return toDto(saved);
    }

    @Override
    public UserAddressDto updateAddress(Long addressId, Long userId, UserAddressDto dto) {
        UserAddress entity = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dia chi"));

        if (dto.getIsDefault() != null && dto.getIsDefault() && !Boolean.TRUE.equals(entity.getIsDefault())) {
            addressRepository.clearDefaultForUser(userId);
        }

        applyDtoToEntity(entity, dto);
        entity.setUpdatedAt(LocalDateTime.now());

        UserAddress saved = addressRepository.save(entity);
        log.info("Updated address id={} for user id={}", addressId, userId);
        return toDto(saved);
    }

    @Override
    public void deleteAddress(Long addressId, Long userId) {
        UserAddress entity = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dia chi"));
        addressRepository.delete(entity);
        log.info("Deleted address id={} for user id={}", addressId, userId);
    }

    @Override
    public UserAddressDto setDefaultAddress(Long addressId, Long userId) {
        UserAddress entity = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay dia chi"));

        addressRepository.clearDefaultForUser(userId);
        entity.setIsDefault(true);
        entity.setUpdatedAt(LocalDateTime.now());

        UserAddress saved = addressRepository.save(entity);
        log.info("Set default address id={} for user id={}", addressId, userId);
        return toDto(saved);
    }

    private void applyDtoToEntity(UserAddress entity, UserAddressDto dto) {
        entity.setReceiverName(dto.getReceiverName());
        entity.setReceiverPhone(dto.getReceiverPhone());
        entity.setProvince(dto.getProvince());
        entity.setDistrict(dto.getDistrict());
        entity.setWard(dto.getWard());
        entity.setDetailAddress(dto.getDetailAddress());
        if (dto.getIsDefault() != null) {
            entity.setIsDefault(dto.getIsDefault());
        }
    }

    private UserAddressDto toDto(UserAddress entity) {
        UserAddressDto dto = new UserAddressDto();
        dto.setId(entity.getId());
        dto.setReceiverName(entity.getReceiverName());
        dto.setReceiverPhone(entity.getReceiverPhone());
        dto.setProvince(entity.getProvince());
        dto.setDistrict(entity.getDistrict());
        dto.setWard(entity.getWard());
        dto.setDetailAddress(entity.getDetailAddress());
        dto.setIsDefault(entity.getIsDefault());
        return dto;
    }
}
