package com.tmdt.phone_store_backend.controller;

import com.tmdt.phone_store_backend.service.CloudinaryImageService;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/cloudinary/upload")
public class CloudinaryImageUploadController {

    @Autowired
    private CloudinaryImageService cloudinaryImageService;
    @PostMapping
    public ResponseEntity<Map> uploadImage(@RequestParam("image")MultipartFile file){
        try {
            Map data = this.cloudinaryImageService.upload(file);
            return new ResponseEntity<>(data, HttpStatus.OK);
        } catch (IllegalArgumentException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("message", ex.getMessage());
            return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
        } catch (RuntimeException ex) {
            Map<String, String> error = new HashMap<>();
            error.put("message", ex.getMessage() != null ? ex.getMessage() : "Tải ảnh thất bại");
            return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
