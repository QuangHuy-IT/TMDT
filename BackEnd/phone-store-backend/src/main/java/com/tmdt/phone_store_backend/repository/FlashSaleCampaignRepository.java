package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.FlashSaleCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FlashSaleCampaignRepository extends JpaRepository<FlashSaleCampaign, Long> {

    List<FlashSaleCampaign> findByActiveTrueOrderByStartAtDesc();

    @Query("SELECT c FROM FlashSaleCampaign c WHERE c.active = true AND c.endAt >= :now ORDER BY c.startAt ASC")
    List<FlashSaleCampaign> findActiveCampaignsCurrentlyRunning(LocalDateTime now);

    @Query("SELECT c FROM FlashSaleCampaign c WHERE c.active = true AND c.endAt >= :now")
    List<FlashSaleCampaign> findAllActiveCampaigns(LocalDateTime now);

    Optional<FlashSaleCampaign> findByTitle(String title);

    boolean existsByTitle(String title);
}
