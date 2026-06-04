package com.tmdt.phone_store_backend;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class PhoneStoreApplication {

	@PostConstruct
	public void init() {
		// Set default JVM timezone to Vietnam timezone
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
	}

	public static void main(String[] args) {
		SpringApplication.run(PhoneStoreApplication.class, args);
	}

}

