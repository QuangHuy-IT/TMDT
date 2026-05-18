package com.tmdt.phone_store_backend.dto;

import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BrandDto {
    private Long id;
    private String name;
    private String slug;
    private String logoUrl;
    private Boolean isActive;
    private Integer sortOrder;
    private List<SeriesInfo> series;

    @Getter
    @Setter
    public static class SeriesInfo {
        private Long id;
        private String name;
        private String slug;
        private Integer sortOrder;
    }
}
