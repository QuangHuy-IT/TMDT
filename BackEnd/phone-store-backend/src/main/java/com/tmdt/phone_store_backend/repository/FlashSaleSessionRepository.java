package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.FlashSaleSession;
import com.tmdt.phone_store_backend.domain.entity.FlashSaleSession.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FlashSaleSessionRepository extends JpaRepository<FlashSaleSession, Long> {

    List<FlashSaleSession> findByCampaignIdOrderByStartAtAsc(Long campaignId);

    @Query("SELECT COUNT(s) FROM FlashSaleSession s WHERE s.campaign.id = :campaignId")
    long countByCampaignId(@Param("campaignId") Long campaignId);

    @Query("SELECT s FROM FlashSaleSession s WHERE s.campaign.id = :campaignId AND s.startAt < :startAt ORDER BY s.startAt DESC")
    List<FlashSaleSession> findByCampaignIdAndStartAtBefore(@Param("campaignId") Long campaignId, @Param("startAt") LocalDateTime startAt);

    @Query("SELECT s FROM FlashSaleSession s WHERE s.campaign.id = :campaignId AND s.status = :status ORDER BY s.startAt ASC")
    List<FlashSaleSession> findByCampaignIdAndStatus(@Param("campaignId") Long campaignId, @Param("status") SessionStatus status);

    @Query("SELECT s FROM FlashSaleSession s WHERE s.campaign.active = true AND s.status = :status ORDER BY s.startAt ASC")
    List<FlashSaleSession> findByStatusAndActiveCampaign(@Param("status") SessionStatus status);

    @Modifying
    @Query("UPDATE FlashSaleSession s SET s.status = :newStatus WHERE s.startAt <= :now AND s.endAt >= :now AND s.status != :newStatus")
    int updateRunningSessions(@Param("now") LocalDateTime now, @Param("newStatus") SessionStatus newStatus);

    @Modifying
    @Query("UPDATE FlashSaleSession s SET s.status = 'ENDED' WHERE s.endAt < :now AND s.status != 'ENDED'")
    int updateEndedSessions(@Param("now") LocalDateTime now);

    @Query("SELECT s FROM FlashSaleSession s WHERE s.campaign.active = true ORDER BY s.startAt ASC")
    List<FlashSaleSession> findAllActiveSessions();

    @Query("SELECT s FROM FlashSaleSession s WHERE s.id = :id AND s.campaign.id = :campaignId")
    List<FlashSaleSession> findByIdAndCampaignId(@Param("id") Long id, @Param("campaignId") Long campaignId);
}
