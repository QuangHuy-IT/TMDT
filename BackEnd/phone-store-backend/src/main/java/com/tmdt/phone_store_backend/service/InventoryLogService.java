package com.tmdt.phone_store_backend.service;

import com.tmdt.phone_store_backend.domain.entity.Inventory;
import com.tmdt.phone_store_backend.domain.entity.InventoryLog;
import com.tmdt.phone_store_backend.domain.entity.InventoryLogItem;
import com.tmdt.phone_store_backend.domain.entity.Product;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.enums.StockStatus;
import com.tmdt.phone_store_backend.dto.BatchInventoryAdjustRequestDto;
import com.tmdt.phone_store_backend.dto.InventoryAdjustItemDto;
import com.tmdt.phone_store_backend.dto.InventoryLogDto;
import com.tmdt.phone_store_backend.dto.InventoryLogItemDto;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.InventoryLogRepository;
import com.tmdt.phone_store_backend.repository.InventoryRepository;
import com.tmdt.phone_store_backend.repository.ProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@AllArgsConstructor
@Transactional
public class InventoryLogService {

    private final InventoryLogRepository inventoryLogRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional
    public InventoryLogDto batchAdjust(BatchInventoryAdjustRequestDto request) {
        List<InventoryAdjustItemDto> items = request.getItems();
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Danh sách thay đổi không được trống");
        }

        LocalDateTime now = LocalDateTime.now();
        InventoryLog inventoryLog = new InventoryLog();
        inventoryLog.setLogCode(generateLogCode(now));
        inventoryLog.setNote(request.getNote());
        inventoryLog.setCreatedByName(request.getCreatedByName());
        inventoryLog.setCreatedAt(now);

        List<InventoryLogItem> logItems = new ArrayList<>();

        for (InventoryAdjustItemDto item : items) {
            if (item.getDelta() == null || item.getDelta() == 0) continue;

            ProductVariant variant = productVariantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiên bản: " + item.getVariantId()));

            Product product = variant.getProduct();
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
            int afterStock = beforeStock + item.getDelta();
            if (afterStock < 0) {
                throw new IllegalArgumentException(
                        "Không đủ tồn kho cho phiên bản: " + buildVariantName(product, variant)
                );
            }

            inventory.setQuantityOnHand(afterStock);
            inventory.setStockStatus(resolveStockStatus(afterStock));
            inventory.setUpdatedAt(now);
            inventoryRepository.save(inventory);

            InventoryLogItem logItem = InventoryLogItem.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .variantId(variant.getId())
                    .variantName(buildVariantName(product, variant))
                    .sku(variant.getSku())
                    .beforeStock(beforeStock)
                    .afterStock(afterStock)
                    .delta(item.getDelta())
                    .build();
            logItems.add(logItem);
            inventoryLog.addItem(logItem);
        }

        InventoryLog saved = inventoryLogRepository.save(inventoryLog);

        saved.setTotalAdjustments(logItems.size());
        saved.setTotalProducts(
                logItems.stream().map(InventoryLogItem::getProductId).distinct().toList().size()
        );
        saved = inventoryLogRepository.save(saved);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public Page<InventoryLogDto> getLogs(Pageable pageable) {
        return inventoryLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toDto);
    }

    @Transactional(readOnly = true)
    public InventoryLogDto getLog(Long id) {
        InventoryLog log = inventoryLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy log: " + id));
        return toDto(log);
    }

    private InventoryLogDto toDto(InventoryLog log) {
        List<InventoryLogItemDto> itemDtos = log.getItems().stream()
                .map(this::toItemDto)
                .collect(Collectors.toList());

        return InventoryLogDto.builder()
                .id(log.getId())
                .logCode(log.getLogCode())
                .totalAdjustments(log.getTotalAdjustments())
                .totalProducts(log.getTotalProducts())
                .note(log.getNote())
                .createdByName(log.getCreatedByName())
                .createdAt(log.getCreatedAt())
                .items(itemDtos)
                .build();
    }

    private InventoryLogItemDto toItemDto(InventoryLogItem item) {
        return InventoryLogItemDto.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .productName(item.getProductName())
                .variantId(item.getVariantId())
                .variantName(item.getVariantName())
                .sku(item.getSku())
                .beforeStock(item.getBeforeStock())
                .afterStock(item.getAfterStock())
                .delta(item.getDelta())
                .build();
    }

    private String generateLogCode(LocalDateTime dt) {
        return "NK" + dt.format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
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
        if (quantity <= 0) return StockStatus.OUT_OF_STOCK;
        if (quantity <= 5) return StockStatus.LOW_STOCK;
        return StockStatus.IN_STOCK;
    }
}
