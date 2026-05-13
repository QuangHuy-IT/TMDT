package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.*;
import java.util.List;

public interface FlashSaleService {

    // Public APIs
    FlashSaleResponseDto getPublicFlashSaleData();
    List<FlashSaleCampaignDto> getActiveCampaigns();
    FlashSaleSessionDto getSessionById(Long sessionId);

    // Campaign Admin APIs
    List<FlashSaleCampaignDto> getAllCampaigns();
    FlashSaleCampaignDto createCampaign(CreateCampaignRequestDto request);
    FlashSaleCampaignDto updateCampaign(Long id, UpdateCampaignRequestDto request);
    void deleteCampaign(Long id);
    void activateCampaign(Long id);
    void deactivateCampaign(Long id);

    // Session Admin APIs
    List<FlashSaleSessionDto> getSessionsByCampaign(Long campaignId);
    FlashSaleSessionDto createSession(CreateSessionRequestDto request);
    FlashSaleSessionDto updateSession(Long id, UpdateSessionRequestDto request);
    void deleteSession(Long id);
    void updateSessionStatuses();

    // Flash Sale Product Admin APIs
    List<FlashSaleProductDto> getProductsBySession(Long sessionId);
    FlashSaleProductDto addProductToSession(AddFlashSaleProductRequestDto request);
    FlashSaleProductDto updateFlashSaleProduct(Long id, UpdateFlashSaleProductRequestDto request);
    void removeProductFromSession(Long id);
    void updateProductQuantity(Long id, Integer quantity);
    void incrementSoldQuantity(Long id, Integer quantity);
    void hideProduct(Long id);
    void showProduct(Long id);
}
