package com.example.exchangeRate.dto;

import lombok.Data;

@Data
public class FavoriteCurrencyRequest {
    private String type; // "ADD" or "DEL"
    private Long user_id;
    private String currency_code;
} 