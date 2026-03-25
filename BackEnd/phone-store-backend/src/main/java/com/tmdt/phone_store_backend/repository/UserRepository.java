package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

/**
 * Repository cho entity User
 * Cung cấp các method để tương tác với database
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    /**
     * Tìm user theo email
     */
    Optional<User> findByEmail(String email);
    
    /**
     * Kiểm tra email đã tồn tại hay không
     */
    boolean existsByEmail(String email);
    
    /**
     * Kiểm tra số điện thoại đã tồn tại hay không
     */
    boolean existsByPhone(String phone);
    
    /**
     * Tìm user theo số điện thoại
     */
    Optional<User> findByPhone(String phone);
}
