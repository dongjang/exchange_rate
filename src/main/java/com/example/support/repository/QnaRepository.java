package com.example.support.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.support.domain.Qna;

@Repository
public interface QnaRepository extends JpaRepository<Qna, Long> {
    int countByStatus(Qna.QnaStatus status);
}
