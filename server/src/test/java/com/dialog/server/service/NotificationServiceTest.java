package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.dialog.server.domain.MessagingToken;
import com.dialog.server.domain.User;
import com.dialog.server.dto.notification.resposne.MyTokenResponse;
import com.dialog.server.dto.notification.resposne.TokenCreationResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.MessagingTokenRepository;
import com.dialog.server.repository.UserRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessagingTokenRepository messagingTokenRepository;

    @MockitoBean
    private FcmService fcmService;

    private User testUser;
    private User anotherUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .oauthId("test-oauth-123")
                .email("test@example.com")
                .nickname("테스트 사용자")
                .emailNotification(true)
                .build();
        userRepository.save(testUser);

        anotherUser = User.builder()
                .oauthId("another-oauth-456")
                .email("another@example.com")
                .nickname("다른 사용자")
                .emailNotification(true)
                .build();
        userRepository.save(anotherUser);
    }

    @Test
    @DisplayName("메시징 토큰 추가 - 성공")
    void addMessagingToken_Success() {
        // given
        String fcmToken = "test-fcm-token-123";

        // when
        TokenCreationResponse response = notificationService.addMessagingToken(
                testUser.getId(), fcmToken
        );

        // then
        assertThat(response.tokenId()).isNotNull();

        MessagingToken savedToken = messagingTokenRepository.findById(response.tokenId()).orElse(null);
        assertThat(savedToken).isNotNull();
        assertThat(savedToken.getFcmToken()).isEqualTo(fcmToken);
        assertThat(savedToken.getUser().getId()).isEqualTo(testUser.getId());
    }

    @Test
    @DisplayName("메시징 토큰 추가 - 존재하지 않는 사용자")
    void addMessagingToken_UserNotFound() {
        // given
        Long nonExistId = 999L;
        String fcmToken = "test-fcm-token-123";

        // when & then
        assertThatThrownBy(() -> notificationService.addMessagingToken(nonExistId, fcmToken))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("메시징 토큰 삭제 - 성공")
    void deleteMessagingToken_Success() {
        // given
        MessagingToken token = MessagingToken.builder()
                .user(testUser)
                .fcmToken("token-to-delete")
                .build();
        MessagingToken savedToken = messagingTokenRepository.save(token);

        // when
        notificationService.deleteMessagingToken(savedToken.getId());

        // then
        assertThat(messagingTokenRepository.findById(savedToken.getId())).isEmpty();
    }

    @Test
    @DisplayName("사용자별 메시징 토큰 조회 - 성공")
    void getMessagingTokensByUserId_Success() {
        // given
        MessagingToken token1 = MessagingToken.builder()
                .user(testUser)
                .fcmToken("token-1")
                .build();
        MessagingToken token2 = MessagingToken.builder()
                .user(testUser)
                .fcmToken("token-2")
                .build();
        messagingTokenRepository.saveAll(List.of(token1, token2));

        // when
        List<MyTokenResponse> tokens = notificationService.getMessagingTokensByUserId(testUser.getId());

        // then
        assertThat(tokens).hasSize(2);
        assertThat(tokens).extracting(MyTokenResponse::token)
                .containsExactlyInAnyOrder("token-1", "token-2");
    }

    @Test
    @DisplayName("사용자별 메시징 토큰 조회 - 존재하지 않는 사용자")
    void getMessagingTokensByUserId_UserNotFound() {
        // given
        Long nonExistId = 999L;

        // when & then
        assertThatThrownBy(() -> notificationService.getMessagingTokensByUserId(nonExistId))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("토큰 업데이트 - 성공")
    void updateToken_Success() {
        // given
        MessagingToken token = MessagingToken.builder()
                .user(testUser)
                .fcmToken("old-token")
                .build();
        MessagingToken savedToken = messagingTokenRepository.save(token);
        String newToken = "new-token";

        // when
        notificationService.updateToken(testUser.getId(), savedToken.getId(), newToken);

        // then
        MessagingToken updatedToken = messagingTokenRepository.findById(savedToken.getId()).orElse(null);
        assertThat(updatedToken).isNotNull();
        assertThat(updatedToken.getFcmToken()).isEqualTo(newToken);
    }

    @Test
    @DisplayName("토큰 업데이트 - 다른 사용자의 토큰 수정 시도")
    void updateToken_UnauthorizedAccess() {
        // given
        MessagingToken token = MessagingToken.builder()
                .user(testUser)
                .fcmToken("token")
                .build();
        MessagingToken savedToken = messagingTokenRepository.save(token);

        // when & then
        assertThatThrownBy(() -> notificationService.updateToken(
                anotherUser.getId(), savedToken.getId(), "new-token"))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED_TOKEN_ACCESS);
    }

    @Test
    @DisplayName("토큰 업데이트 - 존재하지 않는 토큰")
    void updateToken_TokenNotFound() {
        // given
        Long nonExistentTokenId = 999L;

        // when & then
        assertThatThrownBy(() -> notificationService.updateToken(
                testUser.getId(), nonExistentTokenId, "new-token"))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.MESSAGING_TOKEN_NOT_FOUND);
    }

    @Test
    @DisplayName("토론 생성 알림 발송 - 성공")
    void sendDiscussionCreatedNotification_Success() {
        // given
        User author = testUser;

        User receiver1 = User.builder()
                .oauthId("receiver1")
                .email("receiver1@example.com")
                .nickname("수신자1")
                .emailNotification(true)
                .build();
        User receiver2 = User.builder()
                .oauthId("receiver2")
                .email("receiver2@example.com")
                .nickname("수신자2")
                .emailNotification(true)
                .build();
        User notReceiver = User.builder()
                .oauthId("receiver3")
                .email("receiver3@example.com")
                .nickname("수신자3")
                .emailNotification(false)
                .build();

        userRepository.saveAll(List.of(receiver1, receiver2, notReceiver));

        MessagingToken token1 = MessagingToken.builder()
                .user(receiver1)
                .fcmToken("token-receiver1-1")
                .build();
        MessagingToken token2 = MessagingToken.builder()
                .user(receiver1)
                .fcmToken("token-receiver1-2")
                .build();
        MessagingToken token3 = MessagingToken.builder()
                .user(receiver2)
                .fcmToken("token-receiver2")
                .build();
        MessagingToken token4 = MessagingToken.builder()
                .user(notReceiver)
                .fcmToken("token-receiver3")
                .build();

        messagingTokenRepository.saveAll(List.of(token1, token2, token3, token4));

        String path = "/discussion/123";

        // when
        notificationService.sendDiscussionCreatedNotification(author.getId(), path);

        // then
        final String title = "Dialog";
        final String body = "새 토론 게시글이 등록되었습니다.";

        verify(fcmService, times(3)).sendNotification(
                any(String.class),
                eq(title),
                eq(body),
                eq(path)
        );
        verify(fcmService).sendNotification("token-receiver1-1", title, body, path);
        verify(fcmService).sendNotification("token-receiver1-2", title, body, path);
        verify(fcmService).sendNotification("token-receiver2", title, body, path);
    }

    @Test
    @DisplayName("토론 생성 알림 발송 - 알림 대상이 없는 경우")
    void sendDiscussionCreatedNotification_NoTargets() {
        // given
        User author = testUser;
        String path = "/discussions/123";

        User receiver = User.builder()
                .oauthId("receiver")
                .email("receiver@example.com")
                .nickname("수신자")
                .emailNotification(false)
                .build();
        userRepository.save(receiver);

        // when
        notificationService.sendDiscussionCreatedNotification(author.getId(), path);

        // then
        verify(fcmService, times(0)).sendNotification(any(), any(), any(), any());
    }
}
