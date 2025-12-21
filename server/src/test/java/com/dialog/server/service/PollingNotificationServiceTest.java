package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.NotificationType;
import com.dialog.server.domain.User;
import com.dialog.server.dto.notification.resposne.NotificationPollingResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.repository.NotificationRepository;
import com.dialog.server.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.async.DeferredResult;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_CLASS)
class PollingNotificationServiceTest {

    @Autowired
    private PollingNotificationService pollingNotificationService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private EntityManager entityManager;

    private User testUser;
    private User anotherUser;

    @BeforeEach
    void setUp() {
        // TransactionTemplate이 항상 새로운 트랜잭션을 시작하도록 설정
        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

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

        // setUp에서 생성한 데이터를 커밋하고 새 트랜잭션 시작
        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();
    }

    @AfterEach
    void tearDown() {
        // 테스트 간 데이터 격리를 위해 커밋된 데이터 정리
        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();

        notificationRepository.deleteAll();
        userRepository.deleteAll();

        TestTransaction.flagForCommit();
        TestTransaction.end();
    }

    @Test
    @DisplayName("폴링 요청 시 처리하지 않은 알림이 있으면 즉시 응답한다")
    void pollNotifications_withMissedNotifications_returnsImmediately() {
        // given
        Long userId = testUser.getId();
        String sessionId = "session-1";
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult = new DeferredResult<>();

        // 실제 DB에 알림을 생성
        Notification savedNotification = notificationRepository.save(
                Notification.builder().sender(anotherUser).receiver(testUser).type(NotificationType.DISCUSSION_COMMENT).build()
        );
        Long lastNotificationId = savedNotification.getId() - 1;

        // when
        pollingNotificationService.pollNotifications(userId, sessionId, lastNotificationId, deferredResult);

        // then
        assertThat(deferredResult.hasResult()).isTrue();
        ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>> responseEntity = (ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>) deferredResult.getResult();
        NotificationPollingResponse pollingResponse = responseEntity.getBody().data();
        assertThat(pollingResponse.notifications()).hasSize(1);
    }

    @Test
    @DisplayName("폴링 요청 시 처리하지 않은 알림이 없으면 대기 상태로 들어간다")
    void pollNotifications_withoutMissedNotifications_waits() {
        // given
        Long userId = testUser.getId();
        String sessionId = "session-2";
        Long lastNotificationId = 10L; // DB에 알림이 없으므로, 어떤 ID를 주어도 무방
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult = new DeferredResult<>();

        // when
        pollingNotificationService.pollNotifications(userId, sessionId, lastNotificationId, deferredResult);

        // then
        assertThat(deferredResult.hasResult()).isFalse();
    }

    @Test
    @DisplayName("새 알림 이벤트 발생 시 대기 중인 클라이언트에 알림을 전송한다")
    void handleNotificationEvent_notifiesWaitingClient() {
        // given
        Long userId = testUser.getId();
        String sessionId = "session-3";
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult = new DeferredResult<>();
        // 먼저 대기 상태로 만듦
        pollingNotificationService.pollNotifications(userId, sessionId, 10L, deferredResult);

        // when
        // 새 트랜잭션 시작 전에 현재 트랜잭션의 변경사항을 DB에 반영
        entityManager.flush();

        // 별도 트랜잭션에서 실행하여 이벤트 리스너가 즉시 동작하도록 함
        transactionTemplate.execute(status -> {
            notificationService.createAndPropagateNotification(anotherUser, testUser, NotificationType.DISCUSSION_COMMENT, null);
            return null;
        });

        // then
        assertThat(deferredResult.hasResult()).isTrue();
        ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>> responseEntity = (ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>) deferredResult.getResult();
        NotificationPollingResponse pollingResponse = responseEntity.getBody().data();
        assertThat(pollingResponse.notifications()).hasSize(1);
        assertThat(pollingResponse.unreadCount()).isEqualTo(1L);
    }

    @Test
    @DisplayName("모두 읽음 이벤트 발생 시 대기 중인 클라이언트에 변경된 상태를 전송한다")
    void handleNotificationsReadEvent_notifiesWaitingClient() {
        // given
        // 읽을 알림을 미리 생성
        notificationRepository.save(Notification.builder().sender(anotherUser).receiver(testUser).type(NotificationType.DISCUSSION_COMMENT).build());

        // 알림 데이터를 커밋하고 새 트랜잭션 시작
        TestTransaction.flagForCommit();
        TestTransaction.end();
        TestTransaction.start();

        Long userId = testUser.getId();
        String sessionId = "session-4";
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult = new DeferredResult<>();
        // 대기 상태로 만듦
        pollingNotificationService.pollNotifications(userId, sessionId, 10L, deferredResult);

        // when
        // 새 트랜잭션 시작 전에 현재 트랜잭션의 변경사항을 DB에 반영
        entityManager.flush();

        // 별도 트랜잭션에서 실행하여 이벤트 리스너가 즉시 동작하도록 함
        transactionTemplate.execute(status -> {
            notificationService.updateAllNotificationAsRead(userId);
            return null;
        });

        // then
        assertThat(deferredResult.hasResult()).isTrue();
        ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>> responseEntity = (ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>) deferredResult.getResult();
        NotificationPollingResponse pollingResponse = responseEntity.getBody().data();
        assertAll(
                () -> assertThat(pollingResponse.unreadCount()).isEqualTo(0L),
                () -> assertThat(pollingResponse.notifications()).isEmpty()
        );
    }
}
