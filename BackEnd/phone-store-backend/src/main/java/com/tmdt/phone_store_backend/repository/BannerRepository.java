package com.tmdt.phone_store_backend.repository;

import com.tmdt.phone_store_backend.domain.entity.Banner;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BannerRepository extends JpaRepository<Banner, Long> {

    @Query("""
            select b
            from Banner b
            where b.position = :position
              and b.isActive = true
              and (b.startAt is null or b.startAt <= :now)
              and (b.endAt is null or b.endAt >= :now)
            order by b.sortOrder asc, b.id asc
            """)
    List<Banner> findActiveBannersByPosition(@Param("position") String position,
                                             @Param("now") LocalDateTime now);
}
