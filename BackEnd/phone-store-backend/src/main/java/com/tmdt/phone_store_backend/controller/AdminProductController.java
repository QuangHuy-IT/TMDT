package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.dto.AdminProductDto;
import com.tmdt.phone_store_backend.dto.AdminProductRequestDto;
import com.tmdt.phone_store_backend.dto.ImageUploadResponseDto;
import com.tmdt.phone_store_backend.service.CloudinaryService;
import com.tmdt.phone_store_backend.service.ProductAdminService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/products")
@AllArgsConstructor
public class AdminProductController {

    private final ProductAdminService productAdminService;
    private final CloudinaryService cloudinaryService;

    @GetMapping
    public ResponseEntity<List<AdminProductDto>> getProducts() {
        return ResponseEntity.ok(productAdminService.getAllProducts());
    }

    @PostMapping
    public ResponseEntity<AdminProductDto> createProduct(
            @Valid @RequestBody AdminProductRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productAdminService.createProduct(requestDto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminProductDto> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody AdminProductRequestDto requestDto) {
        return ResponseEntity.ok(productAdminService.updateProduct(id, requestDto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productAdminService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponseDto> uploadImage(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(cloudinaryService.uploadImage(file));
    }
}
