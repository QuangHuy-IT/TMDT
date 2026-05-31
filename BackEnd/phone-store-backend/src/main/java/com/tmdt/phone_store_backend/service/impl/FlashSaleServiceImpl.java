package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.*;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct.FlashSaleProductStatus;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleSession.SessionStatus;
import com.tmdt.phone_store_backend.dto.*;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.*;
import com.tmdt.phone_store_backend.service.FlashSaleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FlashSaleServiceImpl implements FlashSaleService {

    private static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private LocalDateTime now() {
        return LocalDateTime.now(VIETNAM_ZONE);
    }

    private final FlashSaleCampaignRepository campaignRepository;
    private final FlashSaleSessionRepository sessionRepository;
    private final FlashSaleProductRepository flashSaleProductRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository productImageRepository;

    // ==================== PUBLIC APIs ====================

    @Override
    public FlashSaleResponseDto getPublicFlashSaleData() {
        LocalDateTime now = now();

        List<FlashSaleCampaign> activeCampaigns = campaignRepository.findAllActiveCampaigns(now);

        List<FlashSaleCampaignDto> campaignDtos = activeCampaigns.stream()
                .map(this::toCampaignDtoWithSessions)
                .collect(Collectors.toList());

        // Find featured session (the one currently running or next upcoming)
        FlashSaleSessionDto featuredSession = null;
        for (FlashSaleCampaignDto campaign : campaignDtos) {
            if (campaign.getSessions() != null) {
                for (FlashSaleSessionDto session : campaign.getSessions()) {
                    if (Boolean.TRUE.equals(session.isRunning())) {
                        featuredSession = session;
                        break;
                    }
                }
                if (featuredSession == null) {
                    for (FlashSaleSessionDto session : campaign.getSessions()) {
                        if (Boolean.TRUE.equals(session.isUpcoming())) {
                            featuredSession = session;
                            break;
                        }
                    }
                }
            }
        }

        return FlashSaleResponseDto.builder()
                .campaigns(campaignDtos)
                .featuredSession(featuredSession)
                .totalActiveCampaigns((long) campaignDtos.size())
                .totalActiveSessions(campaignDtos.stream()
                        .mapToLong(c -> c.getSessions() != null ? c.getSessions().size() : 0L).sum())
                .build();
    }

    @Override
    public List<FlashSaleCampaignDto> getActiveCampaigns() {
        LocalDateTime now = now();
        List<FlashSaleCampaign> campaigns = campaignRepository.findAllActiveCampaigns(now);
        return campaigns.stream()
                .map(this::toCampaignDtoWithSessions)
                .collect(Collectors.toList());
    }

    @Override
    public FlashSaleSessionDto getSessionById(Long sessionId) {
        FlashSaleSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy session: " + sessionId));

        // Calculate session number based on its position in the campaign
        List<FlashSaleSession> allSessions = sessionRepository.findByCampaignIdOrderByStartAtAsc(session.getCampaign().getId());
        int sessionNumber = 1;
        for (int i = 0; i < allSessions.size(); i++) {
            if (allSessions.get(i).getId().equals(sessionId)) {
                sessionNumber = i + 1;
                break;
            }
        }

        return toSessionDtoWithProducts(session, sessionNumber);
    }

    // ==================== CAMPAIGN ADMIN APIs ====================

    @Override
    public List<FlashSaleCampaignDto> getAllCampaigns() {
        return campaignRepository.findAll().stream()
                .sorted(Comparator.comparing(FlashSaleCampaign::getStartAt).reversed())
                .map(this::toCampaignDtoWithSessions)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FlashSaleCampaignDto createCampaign(CreateCampaignRequestDto request) {
        validateCampaignDates(request.getStartAt(), request.getEndAt());

        log.info("Creating campaign - title: {}, startAt: {}, endAt: {}, now: {}", 
                request.getTitle(), request.getStartAt(), request.getEndAt(), now());

        FlashSaleCampaign campaign = FlashSaleCampaign.builder()
                .title(request.getTitle())
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .active(true)
                .build();

        FlashSaleCampaign saved = campaignRepository.save(campaign);
        log.info("Created flash sale campaign: {} (ID: {})", saved.getTitle(), saved.getId());
        return toCampaignDtoWithSessions(saved);
    }

    @Override
    @Transactional
    public FlashSaleCampaignDto updateCampaign(Long id, UpdateCampaignRequestDto request) {
        FlashSaleCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy campaign: " + id));

        validateCampaignDates(request.getStartAt(), request.getEndAt());

        campaign.setTitle(request.getTitle());
        campaign.setStartAt(request.getStartAt());
        campaign.setEndAt(request.getEndAt());
        if (request.getIsActive() != null) {
            campaign.setActive(request.getIsActive());
        }

        FlashSaleCampaign saved = campaignRepository.save(campaign);
        log.info("Updated flash sale campaign ID: {}", id);
        return toCampaignDtoWithSessions(saved);
    }

    @Override
    @Transactional
    public void deleteCampaign(Long id) {
        if (!campaignRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy campaign: " + id);
        }
        campaignRepository.deleteById(id);
        log.info("Deleted flash sale campaign ID: {}", id);
    }

    @Override
    @Transactional
    public void activateCampaign(Long id) {
        FlashSaleCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy campaign: " + id));
        campaign.setActive(true);
        campaignRepository.save(campaign);
        log.info("Activated flash sale campaign ID: {}", id);
    }

    @Override
    @Transactional
    public void deactivateCampaign(Long id) {
        FlashSaleCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy campaign: " + id));
        campaign.setActive(false);
        campaignRepository.save(campaign);
        log.info("Deactivated flash sale campaign ID: {}", id);
    }

    // ==================== SESSION ADMIN APIs ====================

    @Override
    public List<FlashSaleSessionDto> getSessionsByCampaign(Long campaignId) {
        if (!campaignRepository.existsById(campaignId)) {
            throw new ResourceNotFoundException("Không tìm thấy campaign: " + campaignId);
        }
        List<FlashSaleSession> sessions = sessionRepository.findByCampaignIdOrderByStartAtAsc(campaignId);
        return IntStream.range(0, sessions.size())
                .mapToObj(i -> toSessionDtoWithProducts(sessions.get(i), i + 1))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FlashSaleSessionDto createSession(CreateSessionRequestDto request) {
        FlashSaleCampaign campaign = campaignRepository.findById(request.getCampaignId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy campaign: " + request.getCampaignId()));

        validateSessionDates(request.getStartAt(), request.getEndAt(), campaign);

        FlashSaleSession session = FlashSaleSession.builder()
                .campaign(campaign)
                .startAt(request.getStartAt())
                .endAt(request.getEndAt())
                .status(determineSessionStatus(request.getStartAt(), request.getEndAt()))
                .build();

        FlashSaleSession saved = sessionRepository.save(session);

        // Calculate session number (new session is always the last one)
        List<FlashSaleSession> allSessions = sessionRepository.findByCampaignIdOrderByStartAtAsc(campaign.getId());
        int sessionNumber = allSessions.size();

        log.info("Created flash sale session for campaign {} (ID: {})", campaign.getTitle(), saved.getId());
        return toSessionDtoWithProducts(saved, sessionNumber);
    }

    @Override
    @Transactional
    public FlashSaleSessionDto updateSession(Long id, UpdateSessionRequestDto request) {
        FlashSaleSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy session: " + id));

        validateSessionDates(request.getStartAt(), request.getEndAt(), session.getCampaign());

        session.setStartAt(request.getStartAt());
        session.setEndAt(request.getEndAt());
        session.updateStatus();

        FlashSaleSession saved = sessionRepository.save(session);

        // Calculate session number based on current position in campaign
        List<FlashSaleSession> allSessions = sessionRepository.findByCampaignIdOrderByStartAtAsc(session.getCampaign().getId());
        int sessionNumber = 1;
        for (int i = 0; i < allSessions.size(); i++) {
            if (allSessions.get(i).getId().equals(id)) {
                sessionNumber = i + 1;
                break;
            }
        }

        log.info("Updated flash sale session ID: {}", id);
        return toSessionDtoWithProducts(saved, sessionNumber);
    }

    @Override
    @Transactional
    public void deleteSession(Long id) {
        if (!sessionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy session: " + id);
        }
        sessionRepository.deleteById(id);
        log.info("Deleted flash sale session ID: {}", id);
    }

    @Override
    @Transactional
    public void updateSessionStatuses() {
        LocalDateTime now = now();

        int updatedRunning = sessionRepository.updateRunningSessions(now, SessionStatus.RUNNING);
        int updatedEnded = sessionRepository.updateEndedSessions(now);

        if (updatedRunning > 0) {
            log.info("Updated {} sessions to RUNNING status", updatedRunning);
        }
        if (updatedEnded > 0) {
            log.info("Updated {} sessions to ENDED status", updatedEnded);
        }

        // Also update individual session objects
        List<FlashSaleSession> allActive = sessionRepository.findAllActiveSessions();
        for (FlashSaleSession session : allActive) {
            SessionStatus oldStatus = session.getStatus();
            session.updateStatus();
            if (oldStatus != session.getStatus()) {
                sessionRepository.save(session);
                log.debug("Session {} status changed: {} -> {}", session.getId(), oldStatus, session.getStatus());
            }
        }
    }

    // ==================== FLASH SALE PRODUCT ADMIN APIs ====================

    @Override
    public List<FlashSaleProductDto> getProductsBySession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Không tìm thấy session: " + sessionId);
        }
        List<FlashSaleProduct> products = flashSaleProductRepository.findBySessionIdWithVariantAndProductOrderBySortOrderAsc(sessionId);
        Map<Long, String> thumbnailByProductId = getPrimaryImageUrlByProductId(products);
        return products.stream()
                .map(product -> toProductDto(product, thumbnailByProductId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public FlashSaleProductDto addProductToSession(AddFlashSaleProductRequestDto request) {
        FlashSaleSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy session: " + request.getSessionId()));

        ProductVariant variant = variantRepository.findById(request.getVariantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy variant: " + request.getVariantId()));

        // Check if already exists
        Optional<FlashSaleProduct> existing = flashSaleProductRepository.findBySessionIdAndVariantId(
                request.getSessionId(), request.getVariantId());
        if (existing.isPresent()) {
            throw new com.tmdt.phone_store_backend.exception.ResourceAlreadyExistsException(
                    "Sản phẩm đã tồn tại trong session này");
        }

        // Validate flash price
        if (request.getFlashPrice().compareTo(variant.getPrice()) >= 0) {
            throw new IllegalArgumentException("Giá flash sale phải nhỏ hơn giá gốc của sản phẩm");
        }

        FlashSaleProduct flashProduct = FlashSaleProduct.builder()
                .session(session)
                .variant(variant)
                .flashPrice(request.getFlashPrice())
                .quantity(request.getQuantity())
                .soldQuantity(0)
                .limitPerUser(request.getLimitPerUser() != null ? request.getLimitPerUser() : 1)
                .status(FlashSaleProductStatus.ACTIVE)
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .build();

        FlashSaleProduct saved = flashSaleProductRepository.save(flashProduct);
        log.info("Added product variant {} to flash sale session {} (ID: {})",
                variant.getSku(), session.getId(), saved.getId());
        return toProductDto(saved);
    }

    @Override
    @Transactional
    public FlashSaleProductDto updateFlashSaleProduct(Long id, UpdateFlashSaleProductRequestDto request) {
        FlashSaleProduct flashProduct = flashSaleProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy flash sale product: " + id));

        if (request.getFlashPrice() != null) {
            if (request.getFlashPrice().compareTo(flashProduct.getVariant().getPrice()) >= 0) {
                throw new IllegalArgumentException("Giá flash sale phải nhỏ hơn giá gốc");
            }
            flashProduct.setFlashPrice(request.getFlashPrice());
        }
        if (request.getQuantity() != null) {
            flashProduct.setQuantity(request.getQuantity());
        }
        if (request.getSoldQuantity() != null) {
            flashProduct.setSoldQuantity(request.getSoldQuantity());
        }
        if (request.getLimitPerUser() != null) {
            flashProduct.setLimitPerUser(request.getLimitPerUser());
        }
        if (request.getSortOrder() != null) {
            flashProduct.setSortOrder(request.getSortOrder());
        }
        if (request.getStatus() != null) {
            flashProduct.setStatus(FlashSaleProductStatus.valueOf(request.getStatus()));
        }

        // Auto-update sold out status
        flashProduct.updateStatus();

        FlashSaleProduct saved = flashSaleProductRepository.save(flashProduct);
        log.info("Updated flash sale product ID: {}", id);
        return toProductDto(saved);
    }

    @Override
    @Transactional
    public void removeProductFromSession(Long id) {
        if (!flashSaleProductRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy flash sale product: " + id);
        }
        flashSaleProductRepository.deleteById(id);
        log.info("Removed flash sale product ID: {}", id);
    }

    @Override
    @Transactional
    public void updateProductQuantity(Long id, Integer quantity) {
        FlashSaleProduct flashProduct = flashSaleProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy flash sale product: " + id));
        flashProduct.setQuantity(quantity);
        flashProduct.updateStatus();
        flashSaleProductRepository.save(flashProduct);
        log.info("Updated quantity for flash sale product {} to {}", id, quantity);
    }

    @Override
    @Transactional
    public void incrementSoldQuantity(Long id, Integer quantity) {
        FlashSaleProduct flashProduct = flashSaleProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy flash sale product: " + id));

        int newSold = flashProduct.getSoldQuantity() + quantity;
        flashProduct.setSoldQuantity(Math.min(newSold, flashProduct.getQuantity()));
        flashProduct.updateStatus();
        flashSaleProductRepository.save(flashProduct);
        log.info("Incremented sold quantity for flash sale product {} by {}, new total: {}",
                id, quantity, flashProduct.getSoldQuantity());
    }

    @Override
    @Transactional
    public void hideProduct(Long id) {
        FlashSaleProduct flashProduct = flashSaleProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy flash sale product: " + id));
        flashProduct.setStatus(FlashSaleProductStatus.HIDDEN);
        flashSaleProductRepository.save(flashProduct);
        log.info("Hidden flash sale product ID: {}", id);
    }

    @Override
    @Transactional
    public void showProduct(Long id) {
        FlashSaleProduct flashProduct = flashSaleProductRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy flash sale product: " + id));
        flashProduct.setStatus(FlashSaleProductStatus.ACTIVE);
        flashProduct.updateStatus();
        flashSaleProductRepository.save(flashProduct);
        log.info("Shown flash sale product ID: {}", id);
    }

    // ==================== MAPPING METHODS ====================

    private FlashSaleCampaignDto toCampaignDtoWithSessions(FlashSaleCampaign campaign) {
        LocalDateTime now = now();

        log.debug("Mapping campaign {} - startAt: {}, endAt: {}, now: {}", 
                campaign.getTitle(), campaign.getStartAt(), campaign.getEndAt(), now);

        boolean isRunning = !now.isBefore(campaign.getStartAt()) && !now.isAfter(campaign.getEndAt());
        boolean isEnded = now.isAfter(campaign.getEndAt());
        boolean isUpcoming = now.isBefore(campaign.getStartAt());

        log.debug("Campaign status - isRunning: {}, isEnded: {}, isUpcoming: {}", isRunning, isEnded, isUpcoming);

        long remainingSeconds = 0;
        if (isUpcoming) {
            remainingSeconds = ChronoUnit.SECONDS.between(now, campaign.getStartAt());
        } else if (isRunning) {
            remainingSeconds = ChronoUnit.SECONDS.between(now, campaign.getEndAt());
        }

        List<FlashSaleSession> sessions = campaign.getSessions();
        List<FlashSaleSessionDto> sessionDtos = new ArrayList<>();
        if (sessions != null) {
            for (int i = 0; i < sessions.size(); i++) {
                sessionDtos.add(toSessionDtoWithProducts(sessions.get(i), i + 1));
            }
        }

        return FlashSaleCampaignDto.builder()
                .id(campaign.getId())
                .title(campaign.getTitle())
                .isActive(campaign.isActive())
                .startAt(campaign.getStartAt())
                .endAt(campaign.getEndAt())
                .createdAt(campaign.getCreatedAt())
                .isRunning(isRunning)
                .isEnded(isEnded)
                .isUpcoming(isUpcoming)
                .remainingSeconds(remainingSeconds)
                .sessions(sessionDtos)
                .build();
    }

    private FlashSaleSessionDto toSessionDtoWithProducts(FlashSaleSession session, int sessionNumber) {
        LocalDateTime now = now();

        boolean isRunning = !now.isBefore(session.getStartAt()) && !now.isAfter(session.getEndAt());
        boolean isEnded = now.isAfter(session.getEndAt());
        boolean isUpcoming = now.isBefore(session.getStartAt());

        long remainingSeconds = 0;
        if (isUpcoming) {
            remainingSeconds = ChronoUnit.SECONDS.between(now, session.getStartAt());
        } else if (isRunning) {
            remainingSeconds = ChronoUnit.SECONDS.between(now, session.getEndAt());
        }

        List<FlashSaleProduct> products = flashSaleProductRepository.findActiveBySessionIdWithVariantAndProduct(session.getId());
        Map<Long, String> thumbnailByProductId = getPrimaryImageUrlByProductId(products);
        List<FlashSaleProductDto> productDtos = products.stream()
                .map(product -> toProductDto(product, thumbnailByProductId))
                .collect(Collectors.toList());

        return FlashSaleSessionDto.builder()
                .id(session.getId())
                .campaignId(session.getCampaign().getId())
                .sessionNumber(sessionNumber)
                .startAt(session.getStartAt())
                .endAt(session.getEndAt())
                .status(session.getStatus().name())
                .createdAt(session.getCreatedAt())
                .remainingSeconds(remainingSeconds)
                .isUpcoming(isUpcoming)
                .isRunning(isRunning)
                .isEnded(isEnded)
                .products(productDtos)
                .build();
    }

    private FlashSaleProductDto toProductDto(FlashSaleProduct fp) {
        return toProductDto(fp, Map.of());
    }

    private FlashSaleProductDto toProductDto(FlashSaleProduct fp, Map<Long, String> thumbnailByProductId) {
        ProductVariant variant = fp.getVariant();
        Product product = variant.getProduct();

        BigDecimal originalPrice = variant.getPrice();
        BigDecimal flashPrice = fp.getFlashPrice();

        int discountPercent = 0;
        if (flashPrice.compareTo(BigDecimal.ZERO) > 0 && originalPrice.compareTo(BigDecimal.ZERO) > 0) {
            discountPercent = flashPrice.multiply(BigDecimal.valueOf(100))
                    .divide(originalPrice, 0, RoundingMode.DOWN).intValue();
            discountPercent = 100 - discountPercent;
        }

        int progressPercent = 0;
        if (fp.getQuantity() > 0) {
            progressPercent = (int) ((fp.getSoldQuantity() * 100.0) / fp.getQuantity());
        }

        String thumbnail = thumbnailByProductId.get(product.getId());
        if (thumbnail == null) {
            thumbnail = getPrimaryImageUrl(product);
        }

        return FlashSaleProductDto.builder()
                .id(fp.getId())
                .sessionId(fp.getSession().getId())
                .variantId(variant.getId())
                .sku(variant.getSku())
                .color(variant.getColor())
                .ramGb(variant.getRamGb())
                .storageGb(variant.getStorageGb())
                .price(variant.getPrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .flashPrice(flashPrice)
                .quantity(fp.getQuantity())
                .soldQuantity(fp.getSoldQuantity())
                .limitPerUser(fp.getLimitPerUser())
                .status(fp.getStatus().name())
                .sortOrder(fp.getSortOrder())
                .createdAt(fp.getCreatedAt())
                .updatedAt(fp.getUpdatedAt())
                .productId(product.getId())
                .productName(product.getName())
                .productSlug(product.getSlug())
                .thumbnail(thumbnail)
                .discountPercent(discountPercent)
                .originalPrice(originalPrice)
                .remainingQuantity(fp.getQuantity() - fp.getSoldQuantity())
                .progressPercent(Math.min(progressPercent, 100))
                .build();
    }

    private String getPrimaryImageUrl(Product product) {
        if (product == null) return null;
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId());
        if (images == null || images.isEmpty()) return null;

        return images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(images.get(0).getImageUrl());
    }

    private Map<Long, String> getPrimaryImageUrlByProductId(List<FlashSaleProduct> flashSaleProducts) {
        if (flashSaleProducts == null || flashSaleProducts.isEmpty()) return Map.of();

        List<Long> productIds = flashSaleProducts.stream()
                .map(fp -> fp.getVariant() != null ? fp.getVariant().getProduct() : null)
                .filter(Objects::nonNull)
                .map(Product::getId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (productIds.isEmpty()) return Map.of();

        Map<Long, List<ProductImage>> imagesByProductId = productImageRepository
                .findByProductIdInOrderBySortOrderAscIdAsc(productIds)
                .stream()
                .filter(image -> image.getProduct() != null && image.getProduct().getId() != null)
                .collect(Collectors.groupingBy(
                        image -> image.getProduct().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        Map<Long, String> thumbnailByProductId = new LinkedHashMap<>();
        for (Map.Entry<Long, List<ProductImage>> entry : imagesByProductId.entrySet()) {
            List<ProductImage> images = entry.getValue();
            if (images == null || images.isEmpty()) continue;
            String imageUrl = images.stream()
                    .filter(image -> Boolean.TRUE.equals(image.getIsPrimary()))
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(images.get(0).getImageUrl());
            if (imageUrl != null && !imageUrl.isBlank()) {
                thumbnailByProductId.put(entry.getKey(), imageUrl);
            }
        }
        return thumbnailByProductId;
    }

    private void validateCampaignDates(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt == null || endAt == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống");
        }
        if (endAt.isBefore(startAt) || endAt.isEqual(startAt)) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
    }

    private void validateSessionDates(LocalDateTime startAt, LocalDateTime endAt, FlashSaleCampaign campaign) {
        if (startAt == null || endAt == null) {
            throw new IllegalArgumentException("Thời gian bắt đầu và kết thúc không được để trống");
        }
        if (endAt.isBefore(startAt) || endAt.isEqual(startAt)) {
            throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu");
        }
        if (startAt.isBefore(campaign.getStartAt())) {
            throw new IllegalArgumentException("Session phải bắt đầu sau thời gian bắt đầu của campaign");
        }
        if (endAt.isAfter(campaign.getEndAt())) {
            throw new IllegalArgumentException("Session phải kết thúc trước thời gian kết thúc của campaign");
        }
    }

    private SessionStatus determineSessionStatus(LocalDateTime startAt, LocalDateTime endAt) {
        LocalDateTime now = now();
        if (now.isBefore(startAt)) {
            return SessionStatus.UPCOMING;
        } else if (!now.isAfter(endAt)) {
            return SessionStatus.RUNNING;
        } else {
            return SessionStatus.ENDED;
        }
    }
}
