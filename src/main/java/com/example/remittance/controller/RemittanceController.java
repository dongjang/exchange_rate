package com.example.remittance.controller;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.remittance.domain.Remittance;
import com.example.remittance.domain.RemittanceLimitRequest;
import com.example.remittance.dto.RemittanceDetailResponse;
import com.example.remittance.dto.RemittanceLimitCheckResponse;
import com.example.remittance.dto.RemittanceLimitRequestWithFilesResponse;
import com.example.remittance.dto.UserRemittanceHistoryResponse;
import com.example.remittance.dto.UserRemittanceHistorySearchRequest;
import com.example.remittance.dto.UserRemittanceLimitResponse;
import com.example.remittance.service.RemittanceService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/users/remittances")
@RequiredArgsConstructor
@Slf4j
public class RemittanceController {
    private final RemittanceService userRemittanceService;
    
    // 송금 신청 (비동기 처리)
    @PostMapping
    public ResponseEntity<Map<String, Object>> createRemittance(@RequestBody Remittance remittance) {
        try {
            // 통합된 서비스 메서드 호출 (한도 체크 + 저장 + 비동기 처리)
            Map<String, Object> result = userRemittanceService.createRemittanceWithAsyncProcessing(remittance);
            
            // 결과에 따라 응답 반환
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(result);
            } else {
                return ResponseEntity.badRequest().body(result);
            }
            
        } catch (Exception e) {
            // 예외 발생 시 에러 응답
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "PROCESSING_ERROR");
            errorResponse.put("message", "송금 신청 처리 중 오류가 발생했습니다: " + e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    // 송금 상세 조회 (은행 정보 포함)
    @GetMapping("/detail/{remittanceId}")
    public ResponseEntity<RemittanceDetailResponse> getRemittanceDetail(@PathVariable Long remittanceId) {
        try {
            RemittanceDetailResponse remittanceDetail = userRemittanceService.getRemittanceDetailWithBankInfo(remittanceId);
            if (remittanceDetail == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(remittanceDetail);
        } catch (Exception e) {
            log.error("송금 상세 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // 송금 한도 체크
    @PostMapping("/check-limit")
    public ResponseEntity<RemittanceLimitCheckResponse> checkRemittanceLimit(@RequestBody Map<String, Object> request) {
        BigDecimal amount = new BigDecimal(request.get("amount").toString());
        
        RemittanceLimitCheckResponse response = userRemittanceService.checkRemittanceLimit(amount);
        return ResponseEntity.ok(response);
    }

    // 동적 검색 조건으로 송금 이력 조회 (페이징 포함)
    @PostMapping("/history")
    public ResponseEntity<UserRemittanceHistoryResponse> getRemittanceHistory(@RequestBody UserRemittanceHistorySearchRequest params) {
        UserRemittanceHistoryResponse response = userRemittanceService.getRemittanceHistory(params);
        return ResponseEntity.ok(response);
    }   

    // 사용자 송금 한도 조회
    @GetMapping("/user-limit")
    public ResponseEntity<UserRemittanceLimitResponse> getUserRemittanceLimit() {
        try {
            UserRemittanceLimitResponse response = userRemittanceService.getUserRemittanceLimit();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("사용자 송금 한도 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // 사용자 송금 한도 변경 신청 조회
    @GetMapping("/limit-requests-info")
    public ResponseEntity<List<RemittanceLimitRequestWithFilesResponse>> getUserRequests() {
        List<RemittanceLimitRequestWithFilesResponse> requests = userRemittanceService.getUserRequests();
        return ResponseEntity.ok(requests);
    }
    
    // 사용자 송금 한도 변경 신청 상세 조회
    @GetMapping("/{requestId}")
    public ResponseEntity<RemittanceLimitRequest> getUserRequest(@PathVariable Long requestId) {
        RemittanceLimitRequest request = userRemittanceService.getUserRequestById(requestId);
        if (request == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(request);
    }
    
    // 사용자 송금 한도 변경 신청
    @PostMapping("/limit-requests")
    public ResponseEntity<RemittanceLimitRequest> createRequest(
    @RequestParam("dailyLimit") BigDecimal dailyLimit,
    @RequestParam("monthlyLimit") BigDecimal monthlyLimit,
    @RequestParam("singleLimit") BigDecimal singleLimit,
    @RequestParam("reason") String reason,
    @RequestParam(value = "incomeFile", required = false) MultipartFile incomeFile,
    @RequestParam(value = "bankbookFile", required = false) MultipartFile bankbookFile,
    @RequestParam(value = "businessFile", required = false) MultipartFile businessFile) {
        try {
            RemittanceLimitRequest request = userRemittanceService.createRequest(
                dailyLimit, monthlyLimit, singleLimit, reason, incomeFile, bankbookFile, businessFile);
            return ResponseEntity.ok(request);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 사용자 송금 한도 변경 신청 수정
    @PutMapping("/{requestId}")
    public ResponseEntity<RemittanceLimitRequest> updateRequest(
    @PathVariable Long requestId,
    @RequestParam("dailyLimit") BigDecimal dailyLimit,
    @RequestParam("monthlyLimit") BigDecimal monthlyLimit,
    @RequestParam("singleLimit") BigDecimal singleLimit,
    @RequestParam("reason") String reason,
    @RequestParam(value = "incomeFile", required = false) MultipartFile incomeFile,
    @RequestParam(value = "bankbookFile", required = false) MultipartFile bankbookFile,
    @RequestParam(value = "businessFile", required = false) MultipartFile businessFile,
    @RequestParam(value = "isRerequest", defaultValue = "false") boolean isRerequest) {

        try {
            RemittanceLimitRequest request = userRemittanceService.updateRequest(requestId, dailyLimit, monthlyLimit, singleLimit, reason, incomeFile, bankbookFile, businessFile, isRerequest);
            return ResponseEntity.ok(request);
        } catch (IOException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // 신청 취소 API
    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> cancelRequest(@PathVariable Long requestId) {
        try {
            userRemittanceService.cancelRequest(requestId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

} 