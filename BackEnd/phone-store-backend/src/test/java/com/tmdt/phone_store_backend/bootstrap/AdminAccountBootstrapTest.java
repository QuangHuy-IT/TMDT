package com.tmdt.phone_store_backend.bootstrap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.AuthSource;
import com.tmdt.phone_store_backend.domain.enums.UserRole;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import com.tmdt.phone_store_backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AdminAccountBootstrapTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void seedAdminAccountCreatesAdminWhenMissing() {
        AdminAccountBootstrap bootstrap = new AdminAccountBootstrap(
                userRepository,
                passwordEncoder,
                true,
                "admin@gmail.com",
                "Admin@123",
                "Administrator");

        when(userRepository.findByEmail("admin@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Admin@123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        bootstrap.seedAdminAccount();

        verify(userRepository).save(any(User.class));
    }

    @Test
    void seedAdminAccountUpdatesExistingAdmin() {
        AdminAccountBootstrap bootstrap = new AdminAccountBootstrap(
                userRepository,
                passwordEncoder,
                true,
                "admin@gmail.com",
                "Admin@123",
                "Administrator");

        User existing = new User();
        existing.setId(10L);
        existing.setEmail("admin@gmail.com");
        existing.setFullName("Old Name");
        existing.setPasswordHash("old-hash");
        existing.setRole(UserRole.USER);
        existing.setStatus(UserStatus.BLOCKED);
        existing.setEnabled(false);
        existing.setAuthSource(AuthSource.GOOGLE);
        existing.setCreatedAt(LocalDateTime.of(2025, 1, 1, 0, 0));

        when(userRepository.findByEmail("admin@gmail.com")).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode("Admin@123")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        bootstrap.seedAdminAccount();

        assertThat(existing.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(existing.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(existing.isEnabled()).isTrue();
        assertThat(existing.getAuthSource()).isEqualTo(AuthSource.LOCAL);
        assertThat(existing.getPasswordHash()).isEqualTo("hashed-password");
        assertThat(existing.getFullName()).isEqualTo("Administrator");
        verify(userRepository).save(existing);
    }
}