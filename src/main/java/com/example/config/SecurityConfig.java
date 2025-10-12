package com.example.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final Environment env;

    @Bean
    @Order(2)
    public SecurityFilterChain userApiFilterChain(HttpSecurity http, ClientRegistrationRepository clientRegistrationRepository) throws Exception {
        http
            .securityMatcher("/api/users/**", "/api/files/**")
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/users/auth/**").permitAll()
                .requestMatchers("/api/users/notices/**").authenticated()
                .requestMatchers("/api/users/exchange/**").authenticated()
                .requestMatchers("/api/users/remittances/**").authenticated()
                .requestMatchers("/api/users/qna/**").authenticated()
                .requestMatchers("/api/users/banks/**").authenticated()
                .requestMatchers("/api/users/countries/**").authenticated()
                .requestMatchers("/api/users/**").authenticated()
                .requestMatchers("/api/files/*/download").authenticated()
                .requestMatchers("/api/files/*/info").authenticated()
                .requestMatchers("/api/files/**").authenticated()
                .anyRequest().denyAll()
            );
        
        return http.build();
    }

    @Bean
    @Order(3)
    public SecurityFilterChain oauthFilterChain(HttpSecurity http, ClientRegistrationRepository clientRegistrationRepository) throws Exception {
        http
            .securityMatcher("/oauth2/**", "/login/**")
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                .anyRequest().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .defaultSuccessUrl(getFrontendUrl() + "/auth/success", true)
                .failureUrl(getFrontendUrl() + "/auth/failure")
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService)
                )
                .authorizationEndpoint(authorization -> authorization
                    .authorizationRequestResolver(
                        new CustomAuthorizationRequestResolver(
                            clientRegistrationRepository,
                            "/oauth2/authorization"
                        )
                    )
                )
            );
        
        return http.build();
    }

    @Bean
    @Order(1)
    public SecurityFilterChain publicFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/actuator/**", "/health/**", "/api/public/**")
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                // Actuator 엔드포인트 허용 (모니터링용) - 최우선
                .requestMatchers("/actuator/**").permitAll()
                // 헬스체크
                .requestMatchers("/health/**").permitAll()
                // 공개 API
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().denyAll()
            );
        
        return http.build();
    }

    @Bean
    @Order(5)
    public SecurityFilterChain defaultFilterChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/**")
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/", "/remittance", "/countries-banks", "/notices", "/qna", "/auth/**").permitAll()
                .anyRequest().denyAll()
            );
        
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 환경별 허용 origin 설정
        String[] allowedOrigins = getCorsAllowedOrigins();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setExposedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * 환경별 프론트엔드 URL 반환
     */
    private String getFrontendUrl() {
        String corsOrigins = env.getProperty("cors.allowed.origins");
        
        if (corsOrigins != null && !corsOrigins.isEmpty()) {
            // CORS origins에서 첫 번째 Vercel 도메인 찾기
            String[] origins = corsOrigins.split(",");
            for (String origin : origins) {
                if (origin.contains("vercel.app")) {
                    return origin.trim();
                }
            }
        }
        
        // 기본값 (개발 환경)
        return "http://localhost:5173";
    }

    /**
     * 환경별 CORS 허용 origin 설정
     */
    private String[] getCorsAllowedOrigins() {
        String corsOrigins = env.getProperty("cors.allowed.origins");
        
        if (corsOrigins != null && !corsOrigins.isEmpty()) {
            // 환경 변수에서 설정된 경우 (쉼표로 구분된 값들을 배열로 변환)
            return corsOrigins.split(",");
        }
        
        // 환경 변수가 없는 경우 기본값 (개발 환경)
        return new String[]{
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://localhost:8080",
            "http://127.0.0.1:8080"
        };
    }
}