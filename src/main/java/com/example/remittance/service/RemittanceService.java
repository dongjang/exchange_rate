package com.example.remittance.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.example.common.service.FileService;
import com.example.context.SessionContext;
import com.example.remittance.domain.Remittance;
import com.example.remittance.domain.RemittanceLimitRequest;
import com.example.remittance.dto.RemittanceDetailResponse;
import com.example.remittance.dto.RemittanceHistoryDto;
import com.example.remittance.dto.RemittanceLimitCheckResponse;
import com.example.remittance.dto.RemittanceLimitRequestResponse;
import com.example.remittance.dto.RemittanceLimitRequestWithFilesResponse;
import com.example.remittance.dto.UserLimitsResponse;
import com.example.remittance.dto.UserRemittanceHistoryResponse;
import com.example.remittance.dto.UserRemittanceHistorySearchRequest;
import com.example.remittance.dto.UserRemittanceLimitResponse;
import com.example.remittance.mapper.RemittanceLimitRequestMapper;
import com.example.remittance.mapper.RemittanceMapper;
import com.example.remittance.repository.RemittanceLimitRequestRepository;
import com.example.remittance.repository.RemittanceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RemittanceService {
    
    private final RemittanceMapper remittanceMapper;
    private final RemittanceRepository remittanceRepository;
    private final FileService fileService;
    private final RemittanceLimitRequestRepository remittanceLimitRequestRepository;
    private final RemittanceLimitRequestMapper remittanceLimitRequestMapper;
    
    /**
     * 사용자의 송금 한도를 조회합니다.
     * 새로운 쿼리를 사용하여 정확한 한도 계산을 수행합니다.
     */
    @Transactional(readOnly = true)
    public UserRemittanceLimitResponse getUserRemittanceLimit() {

        Long userId = SessionContext.getCurrentUserId();
        // 일일 한도와 월 한도 조회
        BigDecimal availableDailyLimit = remittanceMapper.getDailyLimit(userId);
        BigDecimal availableMonthlyLimit = remittanceMapper.getMonthlyLimit(userId);
        
        // 사용자별 한도 조회 (단일 한도용)
        UserLimitsResponse userLimits = remittanceMapper.getUserLimits(userId);
        
        UserRemittanceLimitResponse response = new UserRemittanceLimitResponse();
        
        // 0보다 작으면 0으로 설정
        if (availableDailyLimit.compareTo(BigDecimal.ZERO) < 0) {
            availableDailyLimit = BigDecimal.ZERO;
        }
        if (availableMonthlyLimit.compareTo(BigDecimal.ZERO) < 0) {
            availableMonthlyLimit = BigDecimal.ZERO;
        }
        
        // 응답 설정
        response.setDailyLimit(availableDailyLimit);
        response.setMonthlyLimit(availableMonthlyLimit);
        response.setOriginalDailyLimit(userLimits.getDailyLimit());
        response.setOriginalMonthlyLimit(userLimits.getMonthlyLimit());
        response.setSingleLimit(userLimits.getSingleLimit());
        
        // 한도 타입 설정
        String limitType = userLimits.getLimitType();
        response.setLimitType(limitType);
        
        return response;
    }

    // 기본 한도 체크 (빠른 검증용)
    public RemittanceLimitCheckResponse checkBasicLimit(BigDecimal amount) {
        // 기존 checkRemittanceLimit과 동일하지만 더 가벼운 버전
        // 실제로는 동일한 로직을 사용하지만, 나중에 더 복잡한 검증을 분리할 수 있음
        return checkRemittanceLimit(amount);
    }

    // 송금 한도 체크
    public RemittanceLimitCheckResponse checkRemittanceLimit(BigDecimal amount) {
        var userLimit = getUserRemittanceLimit();
        
        // 이미 계산된 사용 가능 한도를 사용
        BigDecimal availableDailyLimit = userLimit.getDailyLimit();
        BigDecimal availableMonthlyLimit = userLimit.getMonthlyLimit();
                
        boolean dailyExceeded = amount.compareTo(availableDailyLimit) > 0;
        boolean monthlyExceeded = amount.compareTo(availableMonthlyLimit) > 0;
        
        if (dailyExceeded && monthlyExceeded) {
            return RemittanceLimitCheckResponse.builder()
                .success(false)
                .message("일일 한도와 월 한도를 모두 초과했습니다.")
                .errorType("LIMIT_EXCEEDED")
                .exceededType("BOTH")
                .requestedAmount(amount)
                .dailyLimit(availableDailyLimit)
                .monthlyLimit(availableMonthlyLimit)
                .dailyExceededAmount(amount.subtract(availableDailyLimit))
                .monthlyExceededAmount(amount.subtract(availableMonthlyLimit))
                .build();
        } else if (dailyExceeded) {
            return RemittanceLimitCheckResponse.builder()
                .success(false)
                .message("일일 한도를 초과했습니다.")
                .errorType("LIMIT_EXCEEDED")
                .exceededType("DAILY")
                .requestedAmount(amount)
                .dailyLimit(availableDailyLimit)
                .monthlyLimit(availableMonthlyLimit)
                .dailyExceededAmount(amount.subtract(availableDailyLimit))
                .monthlyExceededAmount(BigDecimal.ZERO)
                .build();
        } else if (monthlyExceeded) {
            return RemittanceLimitCheckResponse.builder()
                .success(false)
                .message("월 한도를 초과했습니다.")
                .errorType("LIMIT_EXCEEDED")
                .exceededType("MONTHLY")
                .requestedAmount(amount)
                .dailyLimit(availableDailyLimit)
                .monthlyLimit(availableMonthlyLimit)
                .dailyExceededAmount(BigDecimal.ZERO)
                .monthlyExceededAmount(amount.subtract(availableMonthlyLimit))
                .build();
        } else {
            return RemittanceLimitCheckResponse.builder()
                .success(true)
                .message("한도 내에서 송금 가능합니다.")
                .requestedAmount(amount)
                .dailyLimit(availableDailyLimit)
                .monthlyLimit(availableMonthlyLimit)
                .build();
        }
    }
    
    // 비동기 송금 처리 (상세 검증 포함)
    @Async("remittanceTaskExecutor")  // 위에서 정의한 스레드 풀 사용
    // @Transactional 제거: 비동기 처리에서는 트랜잭션 분리
    public CompletableFuture<Void> processRemittanceAsync(Long remittanceId) {
        try {
            // 1단계: 송금 정보 조회
            Remittance remittance = remittanceRepository.findById(remittanceId)
                .orElseThrow(() -> new RuntimeException("송금 정보를 찾을 수 없습니다: " + remittanceId));
            
            // 2단계: PROCESSING 상태로 변경
            remittance.setStatus("PROCESSING");
            remittance.setUpdatedAt(LocalDateTime.now());
            remittanceRepository.save(remittance);
            
            // 3단계: 상세 검증 수행
            boolean validationPassed = performDetailedValidation(remittance);
            
            if (validationPassed) {
                // 4단계: 검증 통과 시 COMPLETED 상태로 변경
                remittance.setStatus("COMPLETED");
                remittance.setUpdatedAt(LocalDateTime.now());
                remittanceRepository.save(remittance);
                
                System.out.println("송금 처리 완료: " + remittanceId);
            } else {
                // 5단계: 검증 실패 시 FAILED 상태로 변경
                remittance.setStatus("FAILED");
                remittance.setFailureReason("상세 검증 실패");
                remittance.setUpdatedAt(LocalDateTime.now());
                remittanceRepository.save(remittance);
                
                System.out.println("송금 처리 실패: " + remittanceId);
            }
            
        } catch (Exception e) {
            // 6단계: 예외 발생 시 FAILED 상태로 변경
            try {
                Remittance remittance = remittanceRepository.findById(remittanceId).orElse(null);
                if (remittance != null) {
                    remittance.setStatus("FAILED");
                    remittance.setFailureReason("처리 중 오류 발생: " + e.getMessage());
                    remittance.setUpdatedAt(LocalDateTime.now());
                    remittanceRepository.save(remittance);
                }
            } catch (Exception saveException) {
                System.err.println("송금 상태 저장 실패: " + saveException.getMessage());
            }
            
            System.err.println("송금 처리 중 오류 발생: " + e.getMessage());
        }
        
        return CompletableFuture.completedFuture(null);
    }

    
    // 상세 검증 로직 (실제 비즈니스 로직)
    private boolean performDetailedValidation(Remittance remittance) {
        try {
            // 1. 실시간 한도 재계산 (다른 송금이 동시에 진행될 수 있음)
            var limitCheck = checkRemittanceLimit(remittance.getAmount());
            if (!limitCheck.isSuccess()) {
                System.out.println("실시간 한도 체크 실패: " + limitCheck.getMessage());
                return false;
            }
            
            // 2. 은행 정보 검증 (실제로는 외부 API 호출)
            Thread.sleep(500); // 0.5초 대기 (외부 API 호출 시뮬레이션)
            if (!isValidBankAccount(remittance.getReceiverBank(), remittance.getReceiverAccount())) {
                System.out.println("은행 계좌 검증 실패");
                return false;
            }
            
            // 3. 수신자 정보 검증
            if (!isValidReceiver(remittance.getReceiverName(), remittance.getReceiverCountry())) {
                System.out.println("수신자 정보 검증 실패");
                return false;
            }
            
            // 4. 외부 시스템 검증 (실제로는 외부 API 호출)
            Thread.sleep(300); // 0.3초 대기
            if (!validateWithExternalSystem(remittance)) {
                System.out.println("외부 시스템 검증 실패");
                return false;
            }
            
            System.out.println("상세 검증 완료: " + remittance.getId());
            return true;
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            System.err.println("검증 중 인터럽트 발생: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.err.println("상세 검증 중 오류 발생: " + e.getMessage());
            return false;
        }
    }

    // 은행 계좌 검증 (시뮬레이션)
    private boolean isValidBankAccount(String bank, String account) {
        // 실제로는 외부 은행 API를 호출하여 계좌 유효성 검증
        // 여기서는 간단한 시뮬레이션
        
        // 기본적인 유효성 검증만 수행
        if (bank == null || bank.trim().isEmpty()) {
            System.out.println("은행명이 비어있습니다");
            return false;
        }
        
        if (account == null || account.trim().isEmpty()) {
            System.out.println("계좌번호가 비어있습니다");
            return false;
        }
        
        // 계좌번호는 5자리 이상이면 유효하다고 가정 (전세계적으로 다양함)
        if (account.trim().length() < 5) {
            System.out.println("계좌번호가 너무 짧습니다: " + account);
            return false;
        }
        
        // 실제로는 외부 은행 API를 호출하여 계좌 유효성 검증
        // 여기서는 시뮬레이션으로 항상 통과
        System.out.println("은행 계좌 검증 완료: " + bank + " - " + account);
        return true;
    }

    // 수신자 정보 검증 (시뮬레이션)
    private boolean isValidReceiver(String name, String country) {
        // 실제로는 외부 검증 서비스를 호출
        // 여기서는 간단한 시뮬레이션
        return name != null && !name.trim().isEmpty() && 
               country != null && !country.trim().isEmpty();
    }

    // 외부 시스템 검증 (시뮬레이션)
    private boolean validateWithExternalSystem(Remittance remittance) {
        // 실제로는 외부 금융 시스템, AML(자금세탁방지) 시스템 등을 호출
        // 여기서는 간단한 시뮬레이션
        
        // 1. AML 검증 (자금세탁방지)
        if (!validateAML(remittance)) {
            return false;
        }
        
        // 2. 외환거래 신고 검증
        if (!validateForeignExchange(remittance)) {
            return false;
        }
        
        // 3. 수신자 국가 검증
        if (!validateReceiverCountry(remittance.getReceiverCountry())) {
            return false;
        }
        
        return true;
    }

    // AML 검증 (자금세탁방지)
    private boolean validateAML(Remittance remittance) {
        // 실제로는 외부 AML 시스템 API 호출
        // 여기서는 간단한 시뮬레이션
        // AML은 보통 높은 금액에서 발동하므로 5만달러 이상에서만 체크
        if (remittance.getAmount().compareTo(new BigDecimal("50000")) >= 0) {
            // 5만달러 이상일 때만 AML 검증 (실제로는 외부 API 호출)
            // 여기서는 시뮬레이션으로 항상 통과
            System.out.println("AML 검증 수행: " + remittance.getAmount() + "달러");
        }
        return true; // 시뮬레이션에서는 항상 통과
    }

    // 외환거래 신고 검증
    private boolean validateForeignExchange(Remittance remittance) {
        // 실제로는 외환거래 신고 시스템 API 호출
        // 여기서는 간단한 시뮬레이션
        // 외환거래 신고는 특정 금액 이상에서 신고 의무 (차단이 아님)
        if (remittance.getAmount().compareTo(new BigDecimal("10000")) >= 0) {
            // 1만달러 이상일 때 신고 의무 (실제로는 신고 시스템에 등록)
            System.out.println("외환거래 신고 대상: " + remittance.getAmount() + "달러");
        }
        return true; // 신고 의무는 있지만 송금 자체는 허용
    }

    // 수신자 국가 검증
    private boolean validateReceiverCountry(String country) {
        // 실제로는 제재 국가 목록과 비교
        // 여기서는 간단한 시뮬레이션
        return !"NORTH_KOREA".equals(country) && !"IRAN".equals(country);
    }
        
    // 송금 신청 통합 처리 (한도 체크 + 저장 + 비동기 처리)
    public Map<String, Object> createRemittanceWithAsyncProcessing(Remittance remittance) {
        remittance.setUserId(SessionContext.getCurrentUserId());
        // 1단계: 기본 한도 체크
        var limitCheck = checkBasicLimit(remittance.getAmount());
        if (!limitCheck.isSuccess()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "LIMIT_EXCEEDED");
            errorResponse.put("message", limitCheck.getMessage());
            errorResponse.put("exceededType", limitCheck.getExceededType());
            return errorResponse;
        }
        
        // 2단계: PENDING 상태로 송금 저장
        remittance.setStatus("PENDING");
        if (remittance.getExchangeRate() == null) {
            remittance.setExchangeRate(BigDecimal.ZERO);
        }
        if (remittance.getConvertedAmount() == null) {
            remittance.setConvertedAmount(BigDecimal.ZERO);
        }
        remittance.setCreatedAt(LocalDateTime.now());
        Remittance saved = remittanceRepository.save(remittance);
        
        System.out.println("saved : " + saved);
        // 3단계: 비동기 상세 검증 시작
        processRemittanceAsync(saved.getId());
        
        // 4단계: 성공 응답 반환
        Map<String, Object> successResponse = new HashMap<>();
        successResponse.put("success", true);
        successResponse.put("message", "송금 신청이 접수되었습니다. 송금이력에서 확인해 주세요.");
        successResponse.put("remittanceId", saved.getId());
        successResponse.put("status", "PENDING");
        return successResponse;
    }
    
    // 송금 정보 조회
    public Remittance findById(Long id) {
        return remittanceRepository.findById(id).orElse(null);
    }
    
    // 송금 상세 정보 조회 (은행 정보 포함)
    public RemittanceDetailResponse getRemittanceDetailWithBankInfo(Long remittanceId) {
        Long userId = SessionContext.getCurrentUserId();
        return remittanceMapper.getRemittanceDetailWithBankInfo(remittanceId, userId);
    }

    // 동적 검색 조건으로 송금 내역 조회 (페이징 포함) - 기존 사용자용
    public UserRemittanceHistoryResponse getRemittanceHistory(UserRemittanceHistorySearchRequest params) {
        // 기존 로직을 그대로 유지 (기존 사용자용 API)
        // 파라미터 준비
        BigDecimal minAmount = null;
        BigDecimal maxAmount = null;
        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (StringUtils.hasText(params.getMinAmount())) {
            minAmount = new BigDecimal(params.getMinAmount());
        }
        if (StringUtils.hasText(params.getMaxAmount())) {
            maxAmount = new BigDecimal(params.getMaxAmount());
        }
        if (StringUtils.hasText(params.getStartDate())) {
            startDate = LocalDateTime.parse(params.getStartDate() + "T00:00:00");
        }
        if (StringUtils.hasText(params.getEndDate())) {
            endDate = LocalDateTime.parse(params.getEndDate() + "T23:59:59");
        }

        // 빈 문자열을 null로 변환
        String recipient = StringUtils.hasText(params.getRecipient()) ? params.getRecipient() : null;
        String currency = StringUtils.hasText(params.getCurrency()) ? params.getCurrency() : null;
        String status = StringUtils.hasText(params.getStatus()) ? params.getStatus() : null;

        // 페이징 파라미터 설정
        int page = params.getPage() != 0 ? params.getPage() : 0;
        int size = params.getSize() != 0 ? params.getSize() : 5;
        //int offset = page * size;

        // 정렬 순서 설정 (기본값: 최신순)
        String sortOrder = StringUtils.hasText(params.getSortOrder()) ? params.getSortOrder() : "latest";
        
        Long userId = SessionContext.getCurrentUserId();
        // 전체 데이터 조회 (페이징 없이)
        List<Object[]> allResults = remittanceRepository.findRemittanceHistoryWithBankNames(
            userId,
            recipient,
            currency,
            status,
            minAmount,
            maxAmount,
            startDate,
            endDate,
            sortOrder
        );
        
        // 전체 데이터를 DTO로 변환
        List<RemittanceHistoryDto> allContent = allResults.stream()
            .map(result -> RemittanceHistoryDto.builder()
                .id((Long) result[0])
                .currency((String) result[3])
                .receiverName((String) result[7])
                .amount((BigDecimal) result[8])
                .status((String) result[11])
                .createdAt((LocalDateTime) result[12])
                .build())
            .collect(Collectors.toList());
        
        // 전체 개수는 정렬된 전체 데이터의 크기로 계산
        Long totalElements = (long) allContent.size();
        
        // 페이징 처리
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, allContent.size());
        List<RemittanceHistoryDto> content = allContent.subList(startIndex, endIndex);

        // 페이징 정보 계산
        int totalPages = (int) Math.ceil((double) totalElements / size);
        boolean hasNext = page < totalPages - 1;
        boolean hasPrevious = page > 0;

        return UserRemittanceHistoryResponse.builder()
            .content(content)
            .page(page)
            .size(size)
            .totalElements(totalElements)
            .totalPages(totalPages)
            .hasNext(hasNext)
            .hasPrevious(hasPrevious)
            .build();
    }
        
        // 사용자 페이지용 (JPA)
        public List<RemittanceLimitRequestWithFilesResponse> getUserRequests() {

            Long userId = SessionContext.getCurrentUserId();
            List<RemittanceLimitRequest> requests = remittanceLimitRequestRepository.findByUserId(userId);
            List<RemittanceLimitRequestWithFilesResponse> responses = new ArrayList<>();
            
            for (RemittanceLimitRequest request : requests) {
                RemittanceLimitRequestWithFilesResponse response = new RemittanceLimitRequestWithFilesResponse();
                response.setId(request.getId());
                response.setUserId(request.getUserId());
                response.setUserName(request.getUserName());
                response.setDailyLimit(request.getDailyLimit());
                response.setMonthlyLimit(request.getMonthlyLimit());
                response.setSingleLimit(request.getSingleLimit());
                response.setReason(request.getReason());
                response.setStatus(request.getStatus());
                response.setAdminId(request.getAdminId());
                response.setAdminComment(request.getAdminComment());
                response.setProcessedAt(request.getProcessedAt());
                response.setCreatedAt(request.getCreatedAt());
                response.setUpdatedAt(request.getUpdatedAt());
                
                // 파일 정보 조회 및 설정
                if (request.getIncomeFileId() != null) {
                    var incomeFile = fileService.getFileById(request.getIncomeFileId());
                    if (incomeFile != null) {
                        response.setIncomeFile(new RemittanceLimitRequestWithFilesResponse.FileInfo(
                            incomeFile.getId(),
                            incomeFile.getOriginalName(),
                            incomeFile.getFileSize(),
                            incomeFile.getFileType()
                        ));
                    }
                }
                
                if (request.getBankbookFileId() != null) {
                    var bankbookFile = fileService.getFileById(request.getBankbookFileId());
                    if (bankbookFile != null) {
                        response.setBankbookFile(new RemittanceLimitRequestWithFilesResponse.FileInfo(
                            bankbookFile.getId(),
                            bankbookFile.getOriginalName(),
                            bankbookFile.getFileSize(),
                            bankbookFile.getFileType()
                        ));
                    }
                }
                
                if (request.getBusinessFileId() != null) {
                    var businessFile = fileService.getFileById(request.getBusinessFileId());
                    if (businessFile != null) {
                        response.setBusinessFile(new RemittanceLimitRequestWithFilesResponse.FileInfo(
                            businessFile.getId(),
                            businessFile.getOriginalName(),
                            businessFile.getFileSize(),
                            businessFile.getFileType()
                        ));
                    }
                }
                
                responses.add(response);
            }
            
            return responses;
        }
        
    public RemittanceLimitRequest getUserRequestById(Long requestId) {
        Long userId = SessionContext.getCurrentUserId();
        return remittanceLimitRequestRepository.findById(requestId)
                .filter(request -> request.getUserId().equals(userId))
                .orElse(null);
    }    

    // 한도 변경 신청 생성 (MyBatis 사용)
    @Transactional
    public RemittanceLimitRequest createRequest(BigDecimal dailyLimit, BigDecimal monthlyLimit, BigDecimal singleLimit, String reason, MultipartFile incomeFile, MultipartFile bankbookFile, MultipartFile businessFile) throws IOException {
        Long userId = SessionContext.getCurrentUserId();

        RemittanceLimitRequest request = new RemittanceLimitRequest();
        request.setUserId(userId);
        request.setDailyLimit(dailyLimit);
        request.setMonthlyLimit(monthlyLimit);
        request.setSingleLimit(singleLimit);
        request.setReason(reason);
        request.setStatus(RemittanceLimitRequest.RequestStatus.PENDING);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());
        
        // 파일 업로드 및 파일 ID 설정
        if (incomeFile != null && !incomeFile.isEmpty()) {
            var uploadedFile = fileService.uploadFile(incomeFile, userId);
            request.setIncomeFileId(uploadedFile.getId());
        }
        
        if (bankbookFile != null && !bankbookFile.isEmpty()) {
            var uploadedFile = fileService.uploadFile(bankbookFile, userId);
            request.setBankbookFileId(uploadedFile.getId());
        }
        
        if (businessFile != null && !businessFile.isEmpty()) {
            var uploadedFile = fileService.uploadFile(businessFile, userId);
            request.setBusinessFileId(uploadedFile.getId());
        }
        
        remittanceLimitRequestMapper.insertRemittanceLimitRequest(request);
        return request;
    }

    // 한도 변경 신청 수정 (MyBatis 사용)
    @Transactional
    public RemittanceLimitRequest updateRequest(Long requestId, BigDecimal dailyLimit, BigDecimal monthlyLimit, BigDecimal singleLimit, String reason, MultipartFile incomeFile, MultipartFile bankbookFile, MultipartFile businessFile, boolean isRerequest) throws IOException {
        Long userId = SessionContext.getCurrentUserId();
        // 기존 요청 조회 (DTO로 받음)
        RemittanceLimitRequestResponse existingRequestDto = remittanceLimitRequestMapper.selectRemittanceLimitRequestById(requestId);
        if (existingRequestDto == null || !existingRequestDto.getUserId().equals(userId)) {
            throw new IllegalArgumentException("요청을 찾을 수 없거나 권한이 없습니다.");
        }
        
        // PENDING 상태가 아니면 수정 불가 (재신청 모드가 아닐 때만)
        /* 
        if (!isRerequest && (existingRequestDto.getStatus() != RemittanceLimitRequest.RequestStatus.PENDING || existingRequestDto.getStatus() != RemittanceLimitRequest.RequestStatus.REJECTED)) {
            throw new IllegalArgumentException("대기 또는 반려 상태의 요청만 수정할 수 있습니다.");
        }
        */
        
        // DTO를 엔티티로 변환
        RemittanceLimitRequest existingRequest = new RemittanceLimitRequest();
        existingRequest.setId(existingRequestDto.getId());
        existingRequest.setUserId(existingRequestDto.getUserId());
        existingRequest.setDailyLimit(existingRequestDto.getDailyLimit());
        existingRequest.setMonthlyLimit(existingRequestDto.getMonthlyLimit());
        existingRequest.setSingleLimit(existingRequestDto.getSingleLimit());
        existingRequest.setReason(existingRequestDto.getReason());
        existingRequest.setStatus(RemittanceLimitRequest.RequestStatus.valueOf(existingRequestDto.getStatus()));
        existingRequest.setIncomeFileId(existingRequestDto.getIncomeFileId());
        existingRequest.setBankbookFileId(existingRequestDto.getBankbookFileId());
        existingRequest.setBusinessFileId(existingRequestDto.getBusinessFileId());
        existingRequest.setAdminId(existingRequestDto.getAdminId());
        existingRequest.setAdminComment(existingRequestDto.getAdminComment());
        existingRequest.setProcessedAt(existingRequestDto.getProcessedAt());
        existingRequest.setCreatedAt(existingRequestDto.getCreatedAt());
        existingRequest.setUpdatedAt(existingRequestDto.getUpdatedAt());
        
        // 새로운 데이터로 업데이트
        existingRequest.setDailyLimit(dailyLimit);
        existingRequest.setMonthlyLimit(monthlyLimit);
        existingRequest.setSingleLimit(singleLimit);
        existingRequest.setReason(reason);
        existingRequest.setUpdatedAt(LocalDateTime.now());
        
        // 재신청 모드일 때는 created_at을 현재 시간으로 업데이트하고 status를 PENDING으로 변경
        if (isRerequest) {
            existingRequest.setCreatedAt(LocalDateTime.now());
            existingRequest.setStatus(RemittanceLimitRequest.RequestStatus.PENDING);
            existingRequest.setAdminId(null);
            existingRequest.setAdminComment(null);
            existingRequest.setProcessedAt(null);
        } else if (RemittanceLimitRequest.RequestStatus.valueOf(existingRequestDto.getStatus()) == RemittanceLimitRequest.RequestStatus.REJECTED) {
            // 반려 상태일 때도 수정 시 PENDING으로 변경
            existingRequest.setStatus(RemittanceLimitRequest.RequestStatus.PENDING);
            existingRequest.setAdminId(null);
            existingRequest.setAdminComment(null);
            existingRequest.setProcessedAt(null);
        }
        
        // 새 파일 업로드 및 파일 ID 설정 (새 파일이 있는 경우에만 기존 파일 삭제)
        if (incomeFile != null && !incomeFile.isEmpty()) {
            // 새 파일이 업로드된 경우에만 기존 파일 삭제
            if (existingRequest.getIncomeFileId() != null) {
                fileService.deleteFile(existingRequest.getIncomeFileId());
            }
            var uploadedFile = fileService.uploadFile(incomeFile, userId);
            existingRequest.setIncomeFileId(uploadedFile.getId());
        }
        
        if (bankbookFile != null && !bankbookFile.isEmpty()) {
            // 새 파일이 업로드된 경우에만 기존 파일 삭제
            if (existingRequest.getBankbookFileId() != null) {
                fileService.deleteFile(existingRequest.getBankbookFileId());
            }
            var uploadedFile = fileService.uploadFile(bankbookFile, userId);
            existingRequest.setBankbookFileId(uploadedFile.getId());
        }
        
        if (businessFile != null && !businessFile.isEmpty()) {
            // 새 파일이 업로드된 경우에만 기존 파일 삭제
            if (existingRequest.getBusinessFileId() != null) {
                fileService.deleteFile(existingRequest.getBusinessFileId());
            }
            var uploadedFile = fileService.uploadFile(businessFile, userId);
            existingRequest.setBusinessFileId(uploadedFile.getId());
        }
        
        remittanceLimitRequestMapper.updateRemittanceLimitRequest(existingRequest);
        return existingRequest;
    }

    // 신청 취소 처리
    @Transactional
    public void cancelRequest(Long requestId) {
        Long userId = SessionContext.getCurrentUserId();
        RemittanceLimitRequest request = remittanceLimitRequestRepository.findById(requestId)
                .filter(req -> req.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("요청을 찾을 수 없거나 권한이 없습니다."));
        
        // PENDING 상태가 아니면 취소 불가
        if (request.getStatus() != RemittanceLimitRequest.RequestStatus.PENDING) {
            throw new IllegalArgumentException("대기중인 요청만 취소할 수 있습니다.");
        }
        
        // user_remittance_limit에 해당 사용자의 데이터가 있는지 확인
        int userLimitCount = remittanceLimitRequestMapper.hasUserRemittanceLimit(userId);
        boolean hasUserLimit = userLimitCount > 0;
        
        if (hasUserLimit) {
            remittanceLimitRequestMapper.updateRemittanceLimitRequestStatus(requestId, "APPROVED",  null,null);
            
        } else {
            // user_remittance_limit에 데이터가 없으면 기존 로직대로 삭제
            // 파일 ID들을 임시로 저장
            Long incomeFileId = request.getIncomeFileId();
            Long bankbookFileId = request.getBankbookFileId();
            Long businessFileId = request.getBusinessFileId();
            
            // 먼저 요청에서 파일 ID들을 null로 설정 (외래키 제약조건 해결) - MyBatis 사용
            remittanceLimitRequestMapper.clearFileIds(requestId);
            
            // 첨부된 파일들 삭제
            if (incomeFileId != null) {
                fileService.deleteFile(incomeFileId);
            }
            if (bankbookFileId != null) {
                fileService.deleteFile(bankbookFileId);
            }
            if (businessFileId != null) {
                fileService.deleteFile(businessFileId);
            }
            
            // 요청 삭제
            remittanceLimitRequestRepository.delete(request);
            
        }
    }
        
} 