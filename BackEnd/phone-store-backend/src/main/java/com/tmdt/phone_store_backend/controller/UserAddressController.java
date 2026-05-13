package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.dto.UserAddressDto;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.service.UserAddressService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/users")
@AllArgsConstructor
public class UserAddressController {

    private final UserAddressService addressService;
    private final UserRepository userRepository;

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return user.getId();
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<UserAddressDto>> getAddresses() {
        Long userId = getCurrentUserId();
        List<UserAddressDto> addresses = addressService.getAddressesByUserId(userId);
        return ResponseEntity.ok(addresses);
    }

    @PostMapping("/addresses")
    public ResponseEntity<UserAddressDto> createAddress(
            @Valid @RequestBody UserAddressDto dto) {
        Long userId = getCurrentUserId();
        log.info("Create address for user id={}", userId);
        UserAddressDto created = addressService.createAddress(userId, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<UserAddressDto> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody UserAddressDto dto) {
        Long userId = getCurrentUserId();
        log.info("Update address id={} for user id={}", id, userId);
        UserAddressDto updated = addressService.updateAddress(id, userId, dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.info("Delete address id={} for user id={}", id, userId);
        addressService.deleteAddress(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/addresses/{id}/default")
    public ResponseEntity<UserAddressDto> setDefaultAddress(@PathVariable Long id) {
        Long userId = getCurrentUserId();
        log.info("Set default address id={} for user id={}", id, userId);
        UserAddressDto updated = addressService.setDefaultAddress(id, userId);
        return ResponseEntity.ok(updated);
    }
}
