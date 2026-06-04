package com.tmdt.phone_store_backend.service.impl;

import com.tmdt.phone_store_backend.domain.entity.Inventory;
import com.tmdt.phone_store_backend.domain.entity.Order;
import com.tmdt.phone_store_backend.domain.entity.OrderItem;
import com.tmdt.phone_store_backend.domain.entity.ProductVariant;
import com.tmdt.phone_store_backend.domain.entity.User;
import com.tmdt.phone_store_backend.domain.entity.Voucher;
import com.tmdt.phone_store_backend.domain.enums.OrderStatus;
import com.tmdt.phone_store_backend.domain.enums.PaymentMethod;
import com.tmdt.phone_store_backend.domain.enums.PaymentStatus;
import com.tmdt.phone_store_backend.domain.enums.StockStatus;
import com.tmdt.phone_store_backend.domain.enums.VoucherDiscountType;
import com.tmdt.phone_store_backend.dto.CreateOrderRequestDto;
import com.tmdt.phone_store_backend.dto.OrderDto;
import com.tmdt.phone_store_backend.dto.OrderItemDto;
import com.tmdt.phone_store_backend.exception.BadRequestException;
import com.tmdt.phone_store_backend.exception.ResourceNotFoundException;
import com.tmdt.phone_store_backend.repository.InventoryRepository;
import com.tmdt.phone_store_backend.repository.OrderItemRepository;
import com.tmdt.phone_store_backend.repository.OrderRepository;
import com.tmdt.phone_store_backend.repository.ProductImageRepository;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleProduct;
import com.tmdt.phone_store_backend.repository.FlashSaleProductRepository;
import com.tmdt.phone_store_backend.repository.ProductVariantRepository;
import com.tmdt.phone_store_backend.repository.UserRepository;
import com.tmdt.phone_store_backend.repository.VoucherRepository;
import com.tmdt.phone_store_backend.service.OrderPlacementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderPlacementServiceImpl implements OrderPlacementService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductImageRepository productImageRepository;
    private final VoucherRepository voucherRepository;
    private final InventoryRepository inventoryRepository;
    private final FlashSaleProductRepository flashSaleProductRepository;

    private static final BigDecimal SHIPPING_FEE = BigDecimal.ZERO;
    private static final BigDecimal TOLERANCE = new BigDecimal("0.01");

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderDto createOrder(CreateOrderRequestDto request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung"));

        String orderCode = request.getOrderCode() != null && !request.getOrderCode().isBlank()
                ? request.getOrderCode()
                : "ORD" + System.currentTimeMillis();

        Voucher voucher = null;
        BigDecimal discountAmount = BigDecimal.ZERO;
        if (request.getVoucherId() != null) {
            voucher = voucherRepository.findById(request.getVoucherId())
                    .orElseThrow(() -> new BadRequestException("Voucher khong ton tai"));

            validateVoucher(voucher, request.getSubtotalAmount());

            BigDecimal subtotal = calculateSubtotalFromItems(request);
            discountAmount = calculateDiscount(voucher, subtotal);
        }

        BigDecimal calculatedSubtotal = calculateSubtotalFromItems(request);

        BigDecimal shippingFee = BigDecimal.ZERO;

        BigDecimal calculatedTotal = calculatedSubtotal.add(shippingFee).subtract(discountAmount);
        if (calculatedTotal.compareTo(BigDecimal.ZERO) < 0) {
            calculatedTotal = BigDecimal.ZERO;
        }

        BigDecimal submittedTotal = request.getTotalAmount();
        if (submittedTotal != null) {
            BigDecimal submittedRounded = submittedTotal.setScale(0, RoundingMode.HALF_UP);
            BigDecimal calculatedRounded = calculatedTotal.setScale(0, RoundingMode.HALF_UP);
            BigDecimal difference = submittedRounded.subtract(calculatedRounded).abs();
            log.info("Price check: submitted={}, calculated={}, diff={}", submittedRounded, calculatedRounded, difference);
            if (difference.compareTo(TOLERANCE) > 0) {
                log.warn("Price manipulation detected! Submitted: {}, Calculated: {}", submittedTotal, calculatedTotal);
                throw new BadRequestException("Gia khong hop le. Vui long thu lai.");
            }
        }

        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setUser(user);
        order.setReceiverName(request.getReceiverName());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setShippingAddressText(request.getShippingAddressText());
        order.setNote(request.getNote());
        order.setSubtotalAmount(calculatedSubtotal);
        order.setDiscountAmount(discountAmount);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(calculatedTotal);
        order.setPaymentMethod(PaymentMethod.valueOf(request.getPaymentMethod()));
        order.setPaymentStatus(PaymentStatus.UNPAID);
        order.setOrderStatus(OrderStatus.PENDING);
        order.setVoucher(voucher);
        order.setPlacedAt(LocalDateTime.now());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        order.setOrderItems(new ArrayList<>());

        Order savedOrder = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        for (CreateOrderRequestDto.OrderItemRequestDto itemDto : request.getItems()) {
            ProductVariant variant = productVariantRepository.findById(itemDto.getVariantId())
                    .orElseThrow(() -> new BadRequestException("Khong tim thay san pham: " + itemDto.getProductName()));

            validateUnitPrice(itemDto, variant);

            // Enforce Flash Sale quantity limit and update soldQuantity
            java.time.LocalDateTime now = java.time.LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
            List<FlashSaleProduct> activeFlashSales = flashSaleProductRepository.findActiveByVariantId(variant.getId(), now);
            if (!activeFlashSales.isEmpty()) {
                FlashSaleProduct fp = activeFlashSales.get(0);
                boolean isFlashSalePrice = itemDto.getUnitPrice() != null 
                        && fp.getFlashPrice() != null 
                        && itemDto.getUnitPrice().compareTo(fp.getFlashPrice()) == 0;
                
                if (isFlashSalePrice) {
                    int remainingFsQty = fp.getQuantity() - fp.getSoldQuantity();
                    if (itemDto.getQuantity() > remainingFsQty) {
                        throw new BadRequestException("Sản phẩm " + itemDto.getProductName() + " đã hết hoặc không đủ số lượng Flash Sale còn lại (còn lại: " + remainingFsQty + ")");
                    }
                    if (fp.getLimitPerUser() != null && itemDto.getQuantity() > fp.getLimitPerUser()) {
                        throw new BadRequestException("Số lượng mua sản phẩm " + itemDto.getProductName() + " vượt quá giới hạn Flash Sale của mỗi khách hàng (tối đa: " + fp.getLimitPerUser() + ")");
                    }
                    
                    // Deduct flash sale stock
                    fp.setSoldQuantity(fp.getSoldQuantity() + itemDto.getQuantity());
                    fp.updateStatus();
                    flashSaleProductRepository.save(fp);
                    log.info("Flash sale stock deducted for variant {} in session {}: soldQuantity={}",
                            variant.getId(), fp.getSession().getId(), fp.getSoldQuantity());
                }
            }

            BigDecimal lineTotal = itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setVariant(variant);
            orderItem.setProductNameSnapshot(itemDto.getProductName());
            orderItem.setSkuSnapshot(itemDto.getSku() != null ? itemDto.getSku() : variant.getSku());
            orderItem.setColorSnapshot(itemDto.getColor());
            orderItem.setRamSnapshot(itemDto.getRam());
            orderItem.setStorageSnapshot(itemDto.getStorage());
            orderItem.setUnitPrice(itemDto.getUnitPrice());
            orderItem.setQuantity(itemDto.getQuantity());
            orderItem.setLineTotal(lineTotal);
            orderItem.setCreatedAt(LocalDateTime.now());

            orderItems.add(orderItem);
        }

        orderItemRepository.saveAll(orderItems);
        savedOrder.setOrderItems(orderItems);

        deductStock(request.getItems());

        if (voucher != null) {
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
            log.info("Voucher {} used. New usedCount: {}", voucher.getCode(), voucher.getUsedCount());
        }

        Order finalOrder = orderRepository.save(savedOrder);
        log.info("Created order with orderCode: {} (id={}, total={})",
                finalOrder.getOrderCode(), finalOrder.getId(), finalOrder.getTotalAmount());

        return toDto(finalOrder);
    }

    private BigDecimal calculateSubtotalFromItems(CreateOrderRequestDto request) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (CreateOrderRequestDto.OrderItemRequestDto item : request.getItems()) {
            if (item.getUnitPrice() != null && item.getQuantity() != null) {
                subtotal = subtotal.add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }
        return subtotal;
    }

    private void validateVoucher(Voucher voucher, BigDecimal orderSubtotal) {
        LocalDateTime now = LocalDateTime.now();

        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            throw new BadRequestException("Voucher da bi vo hieu hoa");
        }

        if (voucher.getStartAt() != null && now.isBefore(voucher.getStartAt())) {
            throw new BadRequestException("Voucher chua den thoi gian su dung");
        }

        if (voucher.getEndAt() != null && now.isAfter(voucher.getEndAt())) {
            throw new BadRequestException("Voucher da het han");
        }

        if (voucher.getUsageLimit() != null && voucher.getUsedCount() != null
                && voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new BadRequestException("Voucher da het luot su dung");
        }

        if (voucher.getMinOrderAmount() != null && orderSubtotal != null
                && orderSubtotal.compareTo(voucher.getMinOrderAmount()) < 0) {
            throw new BadRequestException("Don hang phai co gia tri toi thieu "
                    + voucher.getMinOrderAmount() + "d de su dung voucher nay");
        }
    }

    private BigDecimal calculateDiscount(Voucher voucher, BigDecimal subtotal) {
        if (voucher.getDiscountType() == VoucherDiscountType.PERCENT) {
            BigDecimal discount = subtotal.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.DOWN);
            if (voucher.getMaxDiscountAmount() != null && discount.compareTo(voucher.getMaxDiscountAmount()) > 0) {
                discount = voucher.getMaxDiscountAmount();
            }
            return discount;
        } else {
            return voucher.getDiscountValue().min(subtotal);
        }
    }

    private void validateUnitPrice(CreateOrderRequestDto.OrderItemRequestDto itemDto, ProductVariant variant) {
        if (itemDto.getUnitPrice() != null && variant.getPrice() != null) {
            BigDecimal maxAllowedPrice = variant.getPrice().multiply(new BigDecimal("1.5"));
            if (itemDto.getUnitPrice().compareTo(maxAllowedPrice) > 0) {
                log.warn("Price manipulation detected for variant {}. Submitted: {}, Max allowed: {}",
                        variant.getId(), itemDto.getUnitPrice(), maxAllowedPrice);
                throw new BadRequestException("Gia san pham khong hop le");
            }
        }
    }

    private void deductStock(List<CreateOrderRequestDto.OrderItemRequestDto> items) {
        for (CreateOrderRequestDto.OrderItemRequestDto item : items) {
            if (item.getVariantId() == null || item.getQuantity() == null) continue;

            Inventory inventory = inventoryRepository.findByVariantId(item.getVariantId()).orElse(null);
            if (inventory == null) {
                log.warn("Inventory not found for variant {}, skipping stock deduction", item.getVariantId());
                continue;
            }

            int currentStock = inventory.getQuantityOnHand();
            int requestedQty = item.getQuantity();
            int newStock = Math.max(0, currentStock - requestedQty);

            inventory.setQuantityOnHand(newStock);
            inventory.setUpdatedAt(LocalDateTime.now());

            if (newStock <= 0) {
                inventory.setStockStatus(StockStatus.OUT_OF_STOCK);
            } else if (newStock <= 5) {
                inventory.setStockStatus(StockStatus.LOW_STOCK);
            } else {
                inventory.setStockStatus(StockStatus.IN_STOCK);
            }

            inventoryRepository.save(inventory);
            log.info("Stock deducted for variant {}: {} -> {} (status={})",
                    item.getVariantId(), currentStock, newStock, inventory.getStockStatus());
        }
    }

    public void restoreStock(List<OrderItem> orderItems) {
        for (OrderItem item : orderItems) {
            if (item.getVariant() == null || item.getQuantity() == null) continue;

            Inventory inventory = inventoryRepository.findByVariantId(item.getVariant().getId()).orElse(null);
            if (inventory == null) {
                log.warn("Inventory not found for variant {} during restore, skipping", item.getVariant().getId());
                continue;
            }

            int currentStock = inventory.getQuantityOnHand();
            int restoreQty = item.getQuantity();
            int newStock = currentStock + restoreQty;

            inventory.setQuantityOnHand(newStock);
            inventory.setUpdatedAt(LocalDateTime.now());

            if (newStock <= 0) {
                inventory.setStockStatus(StockStatus.OUT_OF_STOCK);
            } else if (newStock <= 5) {
                inventory.setStockStatus(StockStatus.LOW_STOCK);
            } else {
                inventory.setStockStatus(StockStatus.IN_STOCK);
            }

            inventoryRepository.save(inventory);
            log.info("Stock restored for variant {}: {} + {} = {} (status={})",
                    item.getVariant().getId(), currentStock, restoreQty, newStock, inventory.getStockStatus());

            // Restore flash sale quantity if purchased at flash sale price
            java.time.LocalDateTime placedAt = item.getOrder().getPlacedAt() != null 
                    ? item.getOrder().getPlacedAt() 
                    : item.getOrder().getCreatedAt();
            
            if (placedAt != null && item.getVariant() != null && item.getUnitPrice() != null) {
                List<FlashSaleProduct> activeFlashSales = flashSaleProductRepository.findActiveByVariantIdAndTime(
                        item.getVariant().getId(), 
                        placedAt
                );
                if (!activeFlashSales.isEmpty()) {
                    FlashSaleProduct fp = activeFlashSales.get(0);
                    if (fp.getFlashPrice() != null && item.getUnitPrice().compareTo(fp.getFlashPrice()) == 0) {
                        int currentSold = fp.getSoldQuantity();
                        fp.setSoldQuantity(Math.max(0, currentSold - restoreQty));
                        fp.updateStatus();
                        flashSaleProductRepository.save(fp);
                        log.info("Flash sale sold quantity restored for variant {} in session {}: {} -> {}",
                                item.getVariant().getId(), fp.getSession().getId(), currentSold, fp.getSoldQuantity());
                    }
                }
            }
        }
    }

    @Override
    @Transactional
    public OrderDto createOrderAndReturnDto(CreateOrderRequestDto request) {
        return createOrder(request);
    }

    @Override
    @Transactional
    public void updatePaymentStatus(Long orderId, String paymentStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay don hang: " + orderId));
        order.setPaymentStatus(PaymentStatus.valueOf(paymentStatus));
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
    }

    private OrderDto toDto(Order order) {
        List<OrderItemDto> itemDtos = order.getOrderItems() == null
                ? List.of()
                : order.getOrderItems().stream()
                        .map(this::toItemDto)
                        .toList();

        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .orderCode(order.getOrderCode())
                .paymentLinkId(order.getPaymentLinkId())
                .orderStatus(order.getOrderStatus().name())
                .paymentMethod(order.getPaymentMethod().name())
                .paymentStatus(order.getPaymentStatus().name())
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddressText(order.getShippingAddressText())
                .note(order.getNote())
                .subtotalAmount(order.getSubtotalAmount())
                .discountAmount(order.getDiscountAmount())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .placedAt(order.getPlacedAt())
                .paidAt(order.getPaidAt())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemDtos)
                .build();
    }

    private OrderItemDto toItemDto(OrderItem item) {
        String imageUrl = resolveImageUrl(item);

        return OrderItemDto.builder()
                .id(item.getId())
                .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                .productNameSnapshot(item.getProductNameSnapshot())
                .skuSnapshot(item.getSkuSnapshot())
                .colorSnapshot(item.getColorSnapshot())
                .ramSnapshot(item.getRamSnapshot())
                .storageSnapshot(item.getStorageSnapshot())
                .unitPrice(item.getUnitPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getLineTotal())
                .imageUrl(imageUrl)
                .build();
    }

    private String resolveImageUrl(OrderItem item) {
        if (item.getVariant() == null || item.getVariant().getProduct() == null) {
            return null;
        }
        if (item.getVariant().getProduct().getThumbnailUrl() != null
                && !item.getVariant().getProduct().getThumbnailUrl().isBlank()) {
            return item.getVariant().getProduct().getThumbnailUrl();
        }
        Long productId = item.getVariant().getProduct().getId();
        var images = productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(productId);
        if (images.isEmpty()) return null;
        var primary = images.stream().filter(img -> Boolean.TRUE.equals(img.getIsPrimary())).findFirst();
        return primary.map(img -> img.getImageUrl()).orElse(images.get(0).getImageUrl());
    }
}
