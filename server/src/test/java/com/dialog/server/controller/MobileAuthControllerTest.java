package com.dialog.server.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.dialog.server.domain.Role;
import com.dialog.server.domain.SocialType;
import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.UserRepository;
import com.dialog.server.service.AppleTokenVerifier;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class MobileAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppleTokenVerifier appleTokenVerifier;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("신규 Apple 유저 로그인 — isRegistered=false + 세션 저장")
    void newAppleUserLogin() throws Exception {
        Map<String, Object> claims = Map.of("sub", "apple_user_001", "email", "test@icloud.com");
        when(appleTokenVerifier.verify(anyString())).thenReturn(claims);

        MvcResult result = mockMvc.perform(post("/api/auth/mobile/apple/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"identityToken":"valid.jwt.token"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRegistered").value(false))
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession();
        assertThat(session).isNotNull();
        assertThat(session.getAttribute("pending_oauth_id")).isEqualTo("apple_user_001");
        assertThat(session.getAttribute("pending_social_type")).isEqualTo(SocialType.APPLE);
    }

    @Test
    @DisplayName("기존 Apple 유저 로그인 — isRegistered=true + SecurityContext")
    void existingAppleUserLogin() throws Exception {
        userRepository.save(User.builder()
                .oauthId("apple_user_002")
                .nickname("TestUser")
                .socialType(SocialType.APPLE)
                .role(Role.USER)
                .track(Track.BACKEND)
                .build());

        Map<String, Object> claims = Map.of("sub", "apple_user_002");
        when(appleTokenVerifier.verify(anyString())).thenReturn(claims);

        mockMvc.perform(post("/api/auth/mobile/apple/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"identityToken":"valid.jwt.token"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isRegistered").value(true))
                .andExpect(jsonPath("$.data.userId").isNumber())
                .andExpect(jsonPath("$.data.nickname").value("TestUser"));
    }

    @Test
    @DisplayName("토큰 검증 실패 — 401 응답")
    void tokenVerificationFailed() throws Exception {
        when(appleTokenVerifier.verify(anyString()))
                .thenThrow(new DialogException(ErrorCode.INVALID_IDENTITY_TOKEN));

        mockMvc.perform(post("/api/auth/mobile/apple/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"identityToken":"invalid.jwt.token"}
                            """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("identityToken 빈값 — 400 응답")
    void emptyIdentityToken() throws Exception {
        mockMvc.perform(post("/api/auth/mobile/apple/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"identityToken":""}
                            """))
                .andExpect(status().isBadRequest());
    }
}
