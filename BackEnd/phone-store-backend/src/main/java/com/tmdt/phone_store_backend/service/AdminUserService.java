package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.dto.AdminUserDto;
import com.tmdt.phone_store_backend.dto.AdminUserUpdateDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.UserRepository;
import java.time.format.DateTimeFormatter;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public java.util.List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public AdminUserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toDto(user);
    }

    @Transactional
    public AdminUserDto updateUser(Long id, AdminUserUpdateDto updateDto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (updateDto.getRole() != null) user.setRole(updateDto.getRole());
        if (updateDto.getStatus() != null) user.setStatus(updateDto.getStatus());
        user.setUpdatedAt(java.time.LocalDateTime.now());

        return toDto(userRepository.save(user));
    }

    private AdminUserDto toDto(User u) {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(u.getId());
        dto.setEmail(u.getEmail());
        dto.setFullName(u.getFullName());
        dto.setYearOfBirth(u.getYearOfBirth());
        dto.setPhone(u.getPhone());
        dto.setRole(u.getRole());
        dto.setStatus(u.getStatus());
        dto.setAvatarUrl(u.getAvatarUrl());
        dto.setCreatedAt(u.getCreatedAt() != null ? u.getCreatedAt().format(DTF) : null);
        dto.setLastLoginAt(u.getLastLoginAt() != null ? u.getLastLoginAt().format(DTF) : null);
        return dto;
    }
}
