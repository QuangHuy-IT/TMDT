package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Inventory;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.StockStatus;
import com.tmdt.phone_store_backend.dto.AdminInventoryAdjustItemRequestDto;
import com.tmdt.phone_store_backend.dto.AdminInventoryAdjustItemResponseDto;
import com.tmdt.phone_store_backend.dto.AdminInventoryAdjustRequestDto;
import com.tmdt.phone_store_backend.dto.AdminInventoryAdjustResponseDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.InventoryRepository;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Transactional
public class InventoryAdminService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryRepository inventoryRepository;

    public AdminInventoryAdjustResponseDto adjustInventory(
            Long productId,
            AdminInventoryAdjustRequestDto requestDto
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm: " + productId));

        List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
        Map<Long, ProductVariant> variantMap = variants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, variant -> variant));

        LocalDateTime now = LocalDateTime.now();
        List<AdminInventoryAdjustItemResponseDto> appliedChanges = new ArrayList<>();

        for (AdminInventoryAdjustItemRequestDto change : requestDto.getChanges()) {
            if (change == null || change.getDelta() == null || change.getDelta() == 0) {
                continue;
            }

            ProductVariant variant = variantMap.get(change.getVariantId());
            if (variant == null) {
                throw new ResourceNotFoundException(
                        "Biến thể không thuộc sản phẩm " + productId + ": " + change.getVariantId()
                );
            }

            Inventory inventory = inventoryRepository.findByVariantId(variant.getId())
                    .orElseGet(() -> {
                        Inventory created = new Inventory();
                        created.setVariant(variant);
                        created.setQuantityOnHand(0);
                        created.setQuantityReserved(0);
                        created.setReorderLevel(5);
                        created.setStockStatus(StockStatus.OUT_OF_STOCK);
                        created.setUpdatedAt(now);
                        return created;
                    });

            int beforeStock = inventory.getQuantityOnHand() == null ? 0 : inventory.getQuantityOnHand();
            int afterStock = beforeStock + change.getDelta();
            if (afterStock < 0) {
                throw new IllegalArgumentException(
                        "Không đủ tồn kho cho biến thể: " + buildVariantName(product, variant)
                );
            }

            inventory.setQuantityOnHand(afterStock);
            inventory.setStockStatus(resolveStockStatus(afterStock));
            inventory.setUpdatedAt(now);
            inventoryRepository.save(inventory);

            AdminInventoryAdjustItemResponseDto item = new AdminInventoryAdjustItemResponseDto();
            item.setVariantId(variant.getId());
            item.setVariantName(buildVariantName(product, variant));
            item.setBeforeStock(beforeStock);
            item.setDelta(change.getDelta());
            item.setAfterStock(afterStock);
            appliedChanges.add(item);
        }

        AdminInventoryAdjustResponseDto response = new AdminInventoryAdjustResponseDto();
        response.setProductId(product.getId());
        response.setProductName(product.getName());
        response.setNote(requestDto.getNote());
        response.setAppliedAt(now);
        response.setChanges(appliedChanges);
        return response;
    }

    private String buildVariantName(Product product, ProductVariant variant) {
        List<String> parts = new ArrayList<>();
        parts.add(product.getName());
        if (variant.getRamGb() != null && variant.getRamGb() > 0) {
            parts.add(variant.getRamGb() + "GB RAM");
        }
        if (variant.getStorageGb() != null && variant.getStorageGb() > 0) {
            parts.add(variant.getStorageGb() + "GB");
        }
        if (variant.getColor() != null && !variant.getColor().isBlank()) {
            parts.add(variant.getColor());
        }
        return String.join(" - ", parts);
    }

    private StockStatus resolveStockStatus(int quantity) {
        if (quantity <= 0) {
            return StockStatus.OUT_OF_STOCK;
        }
        if (quantity <= 5) {
            return StockStatus.LOW_STOCK;
        }
        return StockStatus.IN_STOCK;
    }
}
