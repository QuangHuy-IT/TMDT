package com.tmdt.phone_store_backend.bootstrap;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.AuthSource;
import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import com.tmdt.phone_store_backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class AdminAccountBootstrap {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String email;
    private final String password;
    private final String fullName;

    public AdminAccountBootstrap(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.seed.enabled:true}") boolean enabled,
            @Value("${app.admin.seed.email:admin@gmail.com}") String email,
            @Value("${app.admin.seed.password:Admin@123}") String password,
            @Value("${app.admin.seed.full-name:Administrator}") String fullName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedAdminAccount() {
        if (!enabled) {
            log.info("Admin account bootstrap is disabled");
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        String passwordHash = passwordEncoder.encode(password);

        User admin = userRepository.findByEmail(email).orElseGet(User::new);
        boolean isNewAccount = admin.getId() == null;

        admin.setEmail(email);
        admin.setFullName(fullName);
        admin.setPasswordHash(passwordHash);
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setEnabled(true);
        admin.setAuthSource(AuthSource.LOCAL);
        admin.setUpdatedAt(now);

        if (isNewAccount || admin.getCreatedAt() == null) {
            admin.setCreatedAt(now);
        }

        userRepository.save(admin);

        if (isNewAccount) {
            log.info("Seeded default admin account: {}", email);
        } else {
            log.info("Ensured default admin account is up to date: {}", email);
        }
    }
}