package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.dialog.server.domain.MessagingToken;
import com.dialog.server.domain.Notification;
import com.dialog.server.domain.NotificationType;
import com.dialog.server.domain.RouteParams;
import com.dialog.server.domain.User;
import com.dialog.server.dto.notification.request.NotificationPageRequest;
import com.dialog.server.dto.notification.resposne.MyTokenResponse;
import com.dialog.server.dto.notification.resposne.NotificationPageResponse;
import com.dialog.server.dto.notification.resposne.TokenCreationResponse;
import com.dialog.server.event.NotificationCreatedEvent;
import com.dialog.server.event.NotificationsReadEvent;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.MessagingTokenRepository;
import com.dialog.server.repository.NotificationRepository;
import com.dialog.server.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@RecordApplicationEvents
class NotificationServiceTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MessagingTokenRepository messagingTokenRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private ApplicationEvents events;

    @MockitoBean
    private FcmService fcmService;

    private User testUser;
    private User anotherUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .oauthId("test-oauth-123")
                .nickname("테스트 사용자")
                .webPushNotification(true)
                .build();
        userRepository.save(testUser);

        anotherUser = User.builder()
                .oauthId("another-oauth-456")
                .nickname("다른 사용자")
                .webPushNotification(true)
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
                .nickname("수신자1")
                .webPushNotification(true)
                .build();
        User receiver2 = User.builder()
                .oauthId("receiver2")
                .nickname("수신자2")
                .webPushNotification(true)
                .build();
        User notReceiver = User.builder()
                .oauthId("receiver3")
                .nickname("수신자3")
                .webPushNotification(false)
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
                .nickname("수신자")
                .webPushNotification(false)
                .build();
        userRepository.save(receiver);

        // when
        notificationService.sendDiscussionCreatedNotification(author.getId(), path);

        // then
        verify(fcmService, times(0)).sendNotification(any(), any(), any(), any());
    }

    @Test
    @DisplayName("알림 생성 및 전파 시 NotificationCreatedEvent가 발행된다")
    void createAndPropagateNotification_publishesEvent() {
        // given
        RouteParams routeParams = null; // 테스트용 dummy

        // when
        notificationService.createAndPropagateNotification(anotherUser, testUser, NotificationType.DISCUSSION_COMMENT, routeParams);

        // then
        long eventCount = events.stream(NotificationCreatedEvent.class)
                .filter(event -> event.getNotification().getReceiver().equals(testUser))
                .filter(event -> event.getNotification().getSender().equals(anotherUser))
                .count();

        assertThat(eventCount).isEqualTo(1);
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 시 NotificationsReadEvent가 발행된다")
    void updateAllNotificationAsRead_publishesEvent() {
        // given
        createNotifications(testUser, anotherUser, 5);
        entityManager.flush();

        // when
        notificationService.updateAllNotificationAsRead(testUser.getId());

        // then
        long eventCount = events.stream(NotificationsReadEvent.class)
                .filter(event -> event.getUserId().equals(testUser.getId()))
                .filter(event -> event.getUnreadCount() == 0L)
                .count();

        assertThat(eventCount).isEqualTo(1);
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 기본값으로 첫 페이지 조회 성공")
    void getNotificationPage_DefaultValues_Success() {
        // given
        createNotifications(testUser, anotherUser, 5);
        NotificationPageRequest request = new NotificationPageRequest(null, null);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(5),
                () -> assertThat(response.currentPage()).isEqualTo(0),
                () -> assertThat(response.pageSize()).isEqualTo(20),
                () -> assertThat(response.totalElements()).isEqualTo(5),
                () -> assertThat(response.totalPages()).isEqualTo(1),
                () -> assertThat(response.unreadCount()).isEqualTo(5L)
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 커스텀 페이지 크기로 조회 성공")
    void getNotificationPage_CustomPageSize_Success() {
        // given
        createNotifications(testUser, anotherUser, 15);
        NotificationPageRequest request = new NotificationPageRequest(0, 10);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(10),
                () -> assertThat(response.currentPage()).isEqualTo(0),
                () -> assertThat(response.pageSize()).isEqualTo(10),
                () -> assertThat(response.totalElements()).isEqualTo(15),
                () -> assertThat(response.totalPages()).isEqualTo(2),
                () -> assertThat(response.unreadCount()).isEqualTo(15L)
        );
    }

    @Test
    @DisplayName("알림 읽음 처리 - 성공")
    void updateNotificationAsRead_Success() {
        // given
        Notification notification = Notification.builder()
                .sender(anotherUser)
                .receiver(testUser)
                .type(NotificationType.DISCUSSION_COMMENT)
                .build();
        Notification savedNotification = notificationRepository.save(notification);

        // when
        notificationService.updateNotificationAsRead(testUser.getId(), savedNotification.getId());

        // then
        Notification updatedNotification = notificationRepository.findById(savedNotification.getId()).orElseThrow();
        assertThat(updatedNotification.isRead()).isTrue();
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 성공")
    void updateAllNotificationAsRead_Success() {
        // given
        createNotifications(testUser, anotherUser, 10);
        entityManager.flush();

        // when
        notificationService.updateAllNotificationAsRead(testUser.getId());

        entityManager.clear();

        // then
        List<Notification> updatedNotifications = notificationRepository
                .findAllByReceiverOrderByCreatedAtDesc(testUser, org.springframework.data.domain.PageRequest.of(0, 20))
                .getContent();

        assertAll(
                () -> assertThat(updatedNotifications).hasSize(10),
                () -> assertThat(updatedNotifications).allMatch(Notification::isRead),
                () -> assertThat(notificationRepository.countByReceiverAndIsReadFalse(testUser))
                        .isEqualTo(0L)
        );
    }

    private List<Notification> createNotifications(User receiver, User sender, int count) {
        return IntStream.range(0, count)
                .mapToObj(i -> {
                    Notification notification = Notification.builder()
                            .sender(sender)
                            .receiver(receiver)
                            .type(NotificationType.DISCUSSION_COMMENT)
                            .build();
                    return notificationRepository.save(notification);
                })
                .toList();
    }
}
