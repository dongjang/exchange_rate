package com.example.common.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class CountryResponse {
    private String code;
    private String codeName;
    private String countryName;
} 