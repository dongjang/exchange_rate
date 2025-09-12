package com.example.exchangeRate.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import com.example.context.SessionContext;
import com.example.exchangeRate.dto.FavoriteCurrencyRequest;
import com.example.exchangeRate.dto.UserFavoriteCurrency;
import com.example.exchangeRate.repository.UserFavoriteCurrencyRepository;
import com.example.user.domain.User;
import com.example.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExchangeRateService {
    //user전용 서비스
    private final UserFavoriteCurrencyRepository userFavoriteCurrencyRepository;
    private final UserRepository userRepository;

    @Value("${exchange.api-key}")
    private String apiKey;

    @Cacheable(value = "exchangeRates", key = "'currentRates'", unless = "#result == null")
    public Map<String, Object> getRates() {
        System.out.println("🌐 외부 환율 API 호출 중... (캐시 미스)");
        String url = "https://v6.exchangerate-api.com/v6/" + apiKey + "/latest/USD";
        RestTemplate restTemplate = new RestTemplate();
        
        // API 호출
        Map<String, Object> apiResponse = restTemplate.getForObject(url, Map.class);
        
            // KRW 기준으로 변환된 환율 데이터 구성
            Map<String, Object> response = new HashMap<>();
            
                // 값이 Integer인 게 있어서 Double로 변환 후 계산
                @SuppressWarnings("unchecked")
                Map<String, Object> originalRatesRaw = (Map<String, Object>) apiResponse.get("conversion_rates");
                Map<String, Double> originalRates = new HashMap<>();
                
                // Object를 안전하게 Double로 변환
                for (Map.Entry<String, Object> entry : originalRatesRaw.entrySet()) {
                    String key = entry.getKey();
                    Object value = entry.getValue();
                    Double doubleValue;
                    
                    if (value instanceof Integer) {
                        doubleValue = ((Integer) value).doubleValue();
                    } else if (value instanceof Double) {
                        doubleValue = (Double) value;
                    } else {
                        doubleValue = Double.valueOf(value.toString());
                    }
                    
                    originalRates.put(key, doubleValue);
                }

                Map<String, Double> calculatedRates = new HashMap<>();
                
                // KRW와 USD는 그대로 사용
                double krwRate = Math.round(originalRates.get("KRW") * 100.0) / 100.0 ;
                calculatedRates.put("KRW", krwRate);

                calculatedRates.put("USD", krwRate);
                // USD를 제외한 다른 통화들은 (1 / rates[해외통화]) * rates[KRW] 공식으로 계산
                for (Map.Entry<String, Double> entry : originalRates.entrySet()) {
                    String currency = entry.getKey();
                    Double rate = entry.getValue();
                    
                    if (!"KRW".equals(currency) && !"USD".equals(currency)) {
                        // (1 / rates[해외통화]) * rates[KRW] 계산
                        double calculatedRate = (1.0 / rate) * krwRate;
                        // 소수점 2째 자리까지 반올림
                        calculatedRate = Math.round(calculatedRate * 100.0) / 100.0;
                        calculatedRates.put(currency, calculatedRate);
                    }
                }
                response.put("rates", calculatedRates);
            
            return response;

    }


    public List<String> getFavoriteCurrencyCodes() {
        Long userId = SessionContext.getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return userFavoriteCurrencyRepository.findCurrencyCodesByUser(user);
    }

    /*
    public List<FavoriteCurrencyResponse> getFavoriteCurrencyResponses(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return userFavoriteCurrencyRepository.findByUser(user).stream()
                .map(FavoriteCurrencyResponse::new)
                .collect(Collectors.toList());
    }
    */

    @Transactional
    public void saveOrDeleteFavoriteCurrency(FavoriteCurrencyRequest request) {
        String type = request.getType(); // "ADD" or "DEL"
        Long userId = SessionContext.getCurrentUserId();
        String currencyCode = request.getCurrency_code();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if ("ADD".equals(type)) {
            // 중복 방지
            if (!userFavoriteCurrencyRepository.existsByUserAndCurrencyCode(user, currencyCode)) {
                UserFavoriteCurrency favorite = UserFavoriteCurrency.builder()
                        .user(user)
                        .currencyCode(currencyCode)
                        .createdAt(LocalDateTime.now())
                        .build();
                userFavoriteCurrencyRepository.save(favorite);
            }
        } else if ("DEL".equals(type)) {
            userFavoriteCurrencyRepository.deleteByUserAndCurrencyCode(user, currencyCode);
        }
    }

} 