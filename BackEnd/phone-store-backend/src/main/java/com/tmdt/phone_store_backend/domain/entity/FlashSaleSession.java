package com.tmdt.phone_store_backend.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "flash_sale_sessions")
public class FlashSaleSession {

    public enum SessionStatus {
        UPCOMING, RUNNING, ENDED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private FlashSaleCampaign campaign;

    @Column(name = "start_at", nullable = false)
    private LocalDateTime startAt;

    @Column(name = "end_at", nullable = false)
    private LocalDateTime endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SessionStatus status = SessionStatus.UPCOMING;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<FlashSaleProduct> products = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @Transient
    public boolean isCurrentlyRunning() {
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(startAt) && !now.isAfter(endAt);
    }

    @Transient
    public boolean isEnded() {
        return LocalDateTime.now().isAfter(endAt);
    }

    @Transient
    public boolean isUpcoming() {
        return LocalDateTime.now().isBefore(startAt);
    }

    public void updateStatus() {
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(startAt)) {
            this.status = SessionStatus.UPCOMING;
        } else if (!now.isAfter(endAt)) {
            this.status = SessionStatus.RUNNING;
        } else {
            this.status = SessionStatus.ENDED;
        }
    }
}
