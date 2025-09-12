package com.example.exchangeRate.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.exchangeRate.dto.FavoriteCurrencyRequest;
import com.example.exchangeRate.service.ExchangeRateService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users/exchange")
public class ExchangeRateController {
    private final ExchangeRateService exchangeRateService;

    // 환율 조회
    @GetMapping("/exchangeRates")
    public ResponseEntity<Map<String, Object>> getExchangeRates() {
        try{
            Map<String, Object> result = exchangeRateService.getRates();
            result.put("success", true);
            return ResponseEntity.ok(result);
        }catch(Exception e){
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "환율 정보를 가져오는데 실패했습니다.\n"+e.getMessage());
            System.out.println("error: "+e.getMessage());
            return ResponseEntity.ok(errorResponse);
        }
    }

    // 로그인된 사용자의 관심 환율 조회
    @GetMapping("/favoriteRatesList")
    public List<String> getFavoriteCurrencyCodes() {
        return exchangeRateService.getFavoriteCurrencyCodes();
    }

    // 관심 환율 등록/삭제
    @PostMapping("/saveFavoriteRates")
    public void saveOrDeleteFavoriteCurrency(@RequestBody FavoriteCurrencyRequest request) {
        exchangeRateService.saveOrDeleteFavoriteCurrency(request);
    }


} 