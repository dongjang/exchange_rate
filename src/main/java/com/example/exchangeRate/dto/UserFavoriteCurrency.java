package com.example.exchangeRate.dto;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

import com.example.user.domain.User;

@Entity
@Table(name = "user_favorite_currency", uniqueConstraints = {
    @UniqueConstraint(name = "uniq_user_currency", columnNames = {"user_id", "currency_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFavoriteCurrency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "currency_code", length = 10, nullable = false)
    private String currencyCode;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;
} 