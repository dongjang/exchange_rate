package com.example.common.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.common.dto.CountryResponse;
import com.example.common.service.CountryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/countries")
@RequiredArgsConstructor
public class CountryController {
    
    private final CountryService userCountryService;
    
    
    @GetMapping("/all")
    public ResponseEntity<List<CountryResponse>> getAllCountries() {
        List<CountryResponse> countries = userCountryService.getAllCountries();
        return ResponseEntity.ok(countries);
    }
    
    @GetMapping("/remittance")
    public ResponseEntity<List<CountryResponse>> getRemittanceCountries() {
        List<CountryResponse> countries = userCountryService.getRemittanceCountries();
        return ResponseEntity.ok(countries);
    }
} 