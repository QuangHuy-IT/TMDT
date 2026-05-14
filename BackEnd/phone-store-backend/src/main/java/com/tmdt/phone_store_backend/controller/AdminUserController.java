package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AdminUserDto;
import com.tmdt.phone_store_backend.dto.AdminUserUpdateDto;
import com.tmdt.phone_store_backend.service.AdminUserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@AllArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<List<AdminUserDto>> getAllUsers() {
        return ResponseEntity.ok(adminUserService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminUserDto> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminUserService.getUserById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminUserDto> updateUser(@PathVariable Long id,
                                                  @Valid @RequestBody AdminUserUpdateDto updateDto) {
        return ResponseEntity.ok(adminUserService.updateUser(id, updateDto));
    }
}
