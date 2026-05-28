package com.tmdt.phone_store_backend.service.impl;

import com.cloudinary.Cloudinary;
import com.tmdt.phone_store_backend.service.CloudinaryImageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
public class CloudinaryImageServiceImpl implements CloudinaryImageService {
    private final Cloudinary cloudinary;

    public CloudinaryImageServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public Map upload(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("File ảnh không hợp lệ");
            }
            Map data = this.cloudinary.uploader().upload(file.getBytes(), Map.of());
            return data;
        } catch (IOException e) {
            log.error("Cannot read image bytes", e);
            throw new RuntimeException("Không thể đọc file ảnh", e);
        } catch (RuntimeException e) {
            log.error("Cloudinary upload failed", e);
            throw e;
        }
    }
}
