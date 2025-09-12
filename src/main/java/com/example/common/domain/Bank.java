package com.example.common.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "bank")
@Getter
@Setter
public class Bank {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "bank_code", length = 20)
    private String bankCode;

    @Transient
    private String countryName;
} 