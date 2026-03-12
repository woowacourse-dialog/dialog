package com.dialog.server.dto.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dialog.server.domain.SocialType;
import com.dialog.server.exception.DialogException;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class GitHubOAuth2UserInfoTest {

    @Test
    @DisplayName("OAuth2UserInfo 인터페이스를 구현한다")
    void implementsOAuth2UserInfo() {
        OAuth2UserInfo info = new GitHubOAuth2UserInfo(
                Map.of("id", 12345, "login", "testuser", "avatar_url", "https://avatar.url"));
        assertThat(info.getOAuthUserId()).isEqualTo("12345");
        assertThat(info.getProfileImageUrl()).isEqualTo("https://avatar.url");
        assertThat(info.getNickname()).isEqualTo("testuser");
        assertThat(info.getSocialType()).isEqualTo(SocialType.GITHUB);
    }

    @Test
    @DisplayName("getGithubUsername은 login 속성을 반환한다")
    void getGithubUsername() {
        GitHubOAuth2UserInfo info = new GitHubOAuth2UserInfo(
                Map.of("id", 12345, "login", "testuser"));
        assertThat(info.getGithubUsername()).isEqualTo("testuser");
    }

    @Test
    @DisplayName("id가 없으면 예외가 발생한다")
    void missingId() {
        GitHubOAuth2UserInfo info = new GitHubOAuth2UserInfo(Map.of("login", "testuser"));
        assertThatThrownBy(info::getOAuthUserId)
                .isInstanceOf(DialogException.class);
    }
}
