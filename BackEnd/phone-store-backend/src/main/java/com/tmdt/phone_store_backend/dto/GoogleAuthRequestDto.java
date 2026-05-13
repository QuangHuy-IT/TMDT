package com.tmdt.phone_store_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequestDto {

    private String idToken;
    private String email;
    private String fullName;
    private String googleId;
    private String avatarUrl;
}
