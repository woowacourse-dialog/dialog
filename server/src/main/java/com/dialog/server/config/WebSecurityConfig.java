package com.dialog.server.config;

import com.dialog.server.controller.handler.OAuth2FailureHandler;
import com.dialog.server.controller.handler.OAuth2SuccessHandler;
import com.dialog.server.service.CustomOAuth2UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final OAuth2FailureHandler oAuth2FailureHandler;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(corsConfigurer -> corsConfigurer.configurationSource(corsConfigurationSource))
                .authorizeHttpRequests(auth -> auth
                                // TODO: 개발 완료 시 아래 행 삭제
                                .anyRequest().permitAll()
                        // TODO: 개발 완료 시 아래 주석 해제
//                        .requestMatchers("/", "/api/signup", "/api/signup/check").permitAll()
//                        .anyRequest().authenticated()
                )
                .oauth2Login(oAuth2LoginConfigurer -> oAuth2LoginConfigurer
                        .authorizationEndpoint(authorization -> authorization.baseUri("/api/oauth2/authorization"))
                        .redirectionEndpoint(redirection -> redirection.baseUri("/api/login/oauth2/code/*"))
                        .successHandler(oAuth2SuccessHandler)
                        .failureHandler(oAuth2FailureHandler)
                        .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService)
                        )
                );
        return http.build();
    }
}
