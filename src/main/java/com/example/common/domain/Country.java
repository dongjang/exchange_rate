package com.example.common.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "country")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Country {
    @Id
    @Column(length = 3)
    private String code; // 통화코드

    @Column(name = "code_name", length = 100, nullable = false)
    private String codeName; // 통화명

    @Column(name = "country_name", length = 100, nullable = false)
    private String countryName; // 국가명
} 