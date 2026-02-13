package com.dialog.server.dto.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.dialog.server.domain.SocialType;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AppleOAuth2UserInfoTest {

    private static final String DEFAULT_PROFILE_URL = "https://test-profile.example.com/default.png";

    @Test
    @DisplayName("sub 클레임에서 OAuth 사용자 ID를 추출한다")
    void getOAuthUserId() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001"), DEFAULT_PROFILE_URL);
        assertThat(info.getOAuthUserId()).isEqualTo("apple_001");
    }

    @Test
    @DisplayName("기본 프로필 이미지 URL을 반환한다")
    void getProfileImageUrl() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001"), DEFAULT_PROFILE_URL);
        assertThat(info.getProfileImageUrl()).isEqualTo(DEFAULT_PROFILE_URL);
    }

    @Test
    @DisplayName("firstName, lastName이 있으면 닉네임으로 사용한다")
    void getNickname_fromFirstAndLastName() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001", "firstName", "길동", "lastName", "홍"),
                DEFAULT_PROFILE_URL);
        assertThat(info.getNickname()).isEqualTo("길동 홍");
    }

    @Test
    @DisplayName("firstName만 있으면 firstName을 닉네임으로 사용한다")
    void getNickname_fromFirstNameOnly() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001", "firstName", "길동"),
                DEFAULT_PROFILE_URL);
        assertThat(info.getNickname()).isEqualTo("길동");
    }

    @Test
    @DisplayName("이름이 없고 이메일이 있으면 이메일에서 닉네임을 추출한다")
    void getNickname_fromEmail() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001", "email", "user@icloud.com"),
                DEFAULT_PROFILE_URL);
        assertThat(info.getNickname()).isEqualTo("user");
    }

    @Test
    @DisplayName("Apple private relay 이메일은 무시하고 기본값을 반환한다")
    void getNickname_ignoresPrivateRelayEmail() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001", "email", "abc@privaterelay.appleid.com"),
                DEFAULT_PROFILE_URL);
        assertThat(info.getNickname()).isEqualTo("Apple_apple_00");
    }

    @Test
    @DisplayName("이름과 이메일이 모두 없으면 sub 기반 기본값을 반환한다")
    void getNickname_fallback() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001"), DEFAULT_PROFILE_URL);
        assertThat(info.getNickname()).isEqualTo("Apple_apple_00");
    }

    @Test
    @DisplayName("socialType이 APPLE이다")
    void getSocialType() {
        AppleOAuth2UserInfo info = new AppleOAuth2UserInfo(
                Map.of("sub", "apple_001"), DEFAULT_PROFILE_URL);
        assertThat(info.getSocialType()).isEqualTo(SocialType.APPLE);
    }
}
