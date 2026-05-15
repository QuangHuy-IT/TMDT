package com.tmdt.phone_store_backend.ai.memory;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service quản lý User Memory - lưu trữ và truy xuất preferences của người dùng
 * trong suốt phiên hội thoại.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MemoryService {

    // In-memory cache cho fast access
    private final Map<String, UserMemory> memoryCache = new ConcurrentHashMap<>();

    /**
     * Lấy hoặc tạo memory cho một session.
     */
    public UserMemory getMemory(String sessionId) {
        UserMemory memory = memoryCache.get(sessionId);
        
        if (memory == null) {
            memory = UserMemory.builder()
                .sessionId(sessionId)
                .createdAt(java.time.LocalDateTime.now())
                .lastUpdated(java.time.LocalDateTime.now())
                .build();
            memoryCache.put(sessionId, memory);
            log.debug("Created new memory for session: {}", sessionId);
        }
        
        return memory;
    }

    /**
     * Cập nhật memory sau một cuộc hội thoại.
     */
    public void updateMemory(String sessionId, String userMessage, String botResponse) {
        UserMemory memory = getMemory(sessionId);
        memory.updateFromMessage(userMessage, botResponse);
        memoryCache.put(sessionId, memory);
        log.debug("Updated memory for session {}: brands={}, budget={}-{}", 
            sessionId, memory.getPreferredBrands(), memory.getMinBudget(), memory.getMaxBudget());
    }

    /**
     * Lấy context string cho prompt.
     */
    public String getMemoryContext(String sessionId) {
        UserMemory memory = getMemory(sessionId);
        return memory.toContextString();
    }

    /**
     * Xóa memory của một session.
     */
    public void clearMemory(String sessionId) {
        memoryCache.remove(sessionId);
        log.info("Cleared memory for session: {}", sessionId);
    }

    /**
     * Thêm sản phẩm vào danh sách quan tâm.
     */
    public void addProductInterest(String sessionId, Long productId, boolean liked) {
        UserMemory memory = getMemory(sessionId);
        
        if (!memory.getViewedProducts().contains(productId)) {
            memory.getViewedProducts().add(productId);
        }
        
        if (liked && !memory.getLikedProducts().contains(productId)) {
            memory.getLikedProducts().add(productId);
        }
        
        memory.setLastUpdated(java.time.LocalDateTime.now());
        memoryCache.put(sessionId, memory);
    }

    /**
     * Lấy danh sách sản phẩm đã thích.
     */
    public List<Long> getLikedProducts(String sessionId) {
        UserMemory memory = getMemory(sessionId);
        return memory.getLikedProducts();
    }

    /**
     * Kiểm tra xem session có preferences không.
     */
    public boolean hasPreferences(String sessionId) {
        UserMemory memory = getMemory(sessionId);
        return !memory.getPreferredBrands().isEmpty()
            || memory.getMaxBudget() != null
            || !memory.getUsagePurpose().isEmpty();
    }
}
