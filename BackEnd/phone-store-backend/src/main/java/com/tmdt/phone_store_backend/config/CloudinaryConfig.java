package com.tmdt.phone_store_backend.config;

import java.util.HashMap;
import java.util.Map;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary configKey(){
        Map config = new HashMap<>();
        config.put("cloud_name", "dsggqo4lb");
        config.put("api_key", "258433544298829");
        config.put("api_secret", "P4-4TiRaDN2N7nW4T9VwT0esy5Y");
        config.put("secure", true);
        return new Cloudinary(config);

    }
}
