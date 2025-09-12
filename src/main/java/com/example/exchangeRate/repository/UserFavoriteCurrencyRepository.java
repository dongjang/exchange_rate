package com.example.exchangeRate.repository;

import com.example.exchangeRate.dto.UserFavoriteCurrency;
import com.example.user.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserFavoriteCurrencyRepository extends JpaRepository<UserFavoriteCurrency, Long> {

    // user로 해당 사용자의 모든 즐겨찾기 통화 엔티티 조회
    List<UserFavoriteCurrency> findByUser(User user);

    // user와 currencyCode로 삭제
    void deleteByUserAndCurrencyCode(User user, String currencyCode);

    // user와 currencyCode로 존재 여부 확인
    boolean existsByUserAndCurrencyCode(User user, String currencyCode);

    // user로 해당 사용자의 모든 currencyCode 리스트 조회
    @Query("SELECT u.currencyCode FROM UserFavoriteCurrency u WHERE u.user = :user")
    List<String> findCurrencyCodesByUser(@Param("user") User user);
} 