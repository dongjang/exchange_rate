package com.example.common.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.common.domain.Country;
import com.example.common.dto.CountryResponse;
import com.example.common.repository.CountryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CountryService {
    
    private final CountryRepository countryRepository;    
    
    public List<CountryResponse> getAllCountries() {
        List<Country> countries = countryRepository.findAll();
        return countries.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<CountryResponse> getRemittanceCountries() {
        return countryRepository.findRemittanceCountries();
    }
    
    private CountryResponse convertToResponse(Country country) {
        return CountryResponse.builder()
                .code(country.getCode())
                .codeName(country.getCodeName())
                .countryName(country.getCountryName())
                .build();
    }
}
