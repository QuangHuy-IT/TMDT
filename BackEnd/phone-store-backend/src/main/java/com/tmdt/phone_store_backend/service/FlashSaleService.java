package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.dto.FlashSaleDto;
import com.tmdt.phone_store_backend.dto.FlashSaleItemDto;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.tmdt.phone_store_backend.domain.entity.FlashSale;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleItem;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductImage;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.ProductStatus;
import com.tmdt.phone_store_backend.repository.FlashSaleItemRepository;
import com.tmdt.phone_store_backend.repository.FlashSaleRepository;
import com.tmdt.phone_store_backend.repository.ProductImageRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import com.tmdt.phone_store_backend.repository.InventoryRepository;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class FlashSaleService {

    private final FlashSaleRepository flashSaleRepository;
    private final FlashSaleItemRepository flashSaleItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;

    public FlashSaleDto getActiveFlashSale() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSale> activeSales = flashSaleRepository.findActiveFlashSales(now);

        if (activeSales.isEmpty()) {
            return null;
        }

        FlashSale flashSale = activeSales.get(0);
        List<FlashSaleItem> items = flashSaleItemRepository.findActiveItemsByFlashSale(flashSale);

        FlashSaleDto dto = new FlashSaleDto();
        dto.setId(flashSale.getId());
        dto.setTitle(flashSale.getTitle());
        dto.setStartAt(flashSale.getStartAt());
        dto.setEndAt(flashSale.getEndAt());
        dto.setIsActive(flashSale.getIsActive());
        dto.setMaxDiscount(extractDiscountFromTitle(flashSale.getTitle()));

        if (flashSale.getEndAt() != null) {
            long seconds = Math.max(0, Duration.between(now, flashSale.getEndAt()).getSeconds());
            dto.setRemainingSeconds(seconds);
        } else {
            dto.setRemainingSeconds(0L);
        }

        List<FlashSaleItemDto> itemDtos = new ArrayList<>();
        for (FlashSaleItem item : items) {
            itemDtos.add(toItemDto(item));
        }
        dto.setItems(itemDtos);

        return dto;
    }

    public List<FlashSaleDto> getAllActiveFlashSales() {
        LocalDateTime now = LocalDateTime.now();
        List<FlashSale> activeSales = flashSaleRepository.findActiveFlashSales(now);

        if (activeSales.isEmpty()) {
            return List.of();
        }

        List<FlashSaleDto> result = new ArrayList<>();
        for (FlashSale flashSale : activeSales) {
            List<FlashSaleItem> items = flashSaleItemRepository.findActiveItemsByFlashSale(flashSale);

            FlashSaleDto dto = new FlashSaleDto();
            dto.setId(flashSale.getId());
            dto.setTitle(flashSale.getTitle());
            dto.setStartAt(flashSale.getStartAt());
            dto.setEndAt(flashSale.getEndAt());
            dto.setIsActive(flashSale.getIsActive());
            dto.setMaxDiscount(extractDiscountFromTitle(flashSale.getTitle()));

            if (flashSale.getEndAt() != null) {
                long seconds = Math.max(0, Duration.between(now, flashSale.getEndAt()).getSeconds());
                dto.setRemainingSeconds(seconds);
            } else {
                dto.setRemainingSeconds(0L);
            }

            List<FlashSaleItemDto> itemDtos = new ArrayList<>();
            for (FlashSaleItem item : items) {
                itemDtos.add(toItemDto(item));
            }
            dto.setItems(itemDtos);

            result.add(dto);
        }

        return result;
    }

    private FlashSaleItemDto toItemDto(FlashSaleItem item) {
        Product product = item.getProduct();
        FlashSaleItemDto dto = new FlashSaleItemDto();
        dto.setId(product.getId());
        dto.setSlug(product.getSlug());
        dto.setName(product.getName());
        dto.setBrand(product.getBrand() != null ? product.getBrand().getName() : null);
        dto.setBrandSlug(product.getBrand() != null ? product.getBrand().getSlug() : null);

        int salePercent = item.getPromotion() != null
                ? item.getPromotion().setScale(0, RoundingMode.HALF_UP).intValue()
                : 0;
        dto.setSale(salePercent);

        BigDecimal basePrice = getProductMinPrice(product.getId());
        dto.setOriginalPrice(basePrice);

        if (salePercent > 0) {
            dto.setPrice(basePrice.multiply(BigDecimal.valueOf(100 - salePercent))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        } else {
            dto.setPrice(basePrice);
        }

        int stock = getProductStock(product.getId());
        dto.setStock(stock);
        dto.setTotalQuantity(item.getQuantity() != null ? item.getQuantity() : 0);
        dto.setSoldQuantity(item.getSoldQuantity() != null ? item.getSoldQuantity() : 0);

        String thumbnail = getProductThumbnail(product);
        dto.setThumbnail(thumbnail);

        return dto;
    }

    private BigDecimal getProductMinPrice(Long productId) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        BigDecimal minPrice = null;
        for (ProductVariant variant : variants) {
            BigDecimal price = variant.getPrice();
            if (price != null) {
                if (minPrice == null || price.compareTo(minPrice) < 0) {
                    minPrice = price;
                }
            }
        }
        return minPrice != null ? minPrice : BigDecimal.ZERO;
    }

    private int getProductStock(Long productId) {
        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        int stock = 0;
        for (ProductVariant variant : variants) {
            stock += inventoryRepository.findByVariantId(variant.getId())
                    .map(inv -> inv.getQuantityOnHand())
                    .orElse(0);
        }
        return stock;
    }

    private String getProductThumbnail(Product product) {
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(product.getId());
        return images.stream()
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(null);
    }

    private Integer extractDiscountFromTitle(String title) {
        if (title == null) return null;
        Pattern pattern = Pattern.compile("(\\d{1,3})%");
        Matcher matcher = pattern.matcher(title);
        Integer maxDiscount = null;
        while (matcher.find()) {
            int discount = Integer.parseInt(matcher.group(1));
            if (maxDiscount == null || discount > maxDiscount) {
                maxDiscount = discount;
            }
        }
        return maxDiscount;
    }
}
