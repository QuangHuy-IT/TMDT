package com.tmdt.phone_store_backend.security;

import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.enums.UserStatus;
import com.tmdt.phone_store_backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.Collection;
import java.util.Collections;

/**
 * Custom UserDetailsService để load user từ database
 */
@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Không tìm thấy người dùng với email: " + email));

        // User must be ACTIVE status AND enabled flag must be true
        boolean isEnabled = user.getStatus() == UserStatus.ACTIVE && user.isEnabled();
        
        // Kiểm tra account không bị xóa (soft delete)
        boolean isNotDeleted = user.getDeletedAt() == null;
        
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(getAuthorities(user))
                .accountExpired(!isNotDeleted)          // Account bị xóa → expired
                .accountLocked(!isEnabled)              // Status không ACTIVE → locked
                .credentialsExpired(false)              // Credentials không hết hạn
                .disabled(!isEnabled)                   // Status không ACTIVE → disabled
                .build();
    }

    /**
     * Lấy quyền của người dùng từ role
     */
    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        String role = "ROLE_" + user.getRole().name();
        return Collections.singletonList(new SimpleGrantedAuthority(role));
    }
}
