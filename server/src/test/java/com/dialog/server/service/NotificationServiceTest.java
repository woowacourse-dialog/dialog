package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.dialog.server.config.S3Config;
import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.MessagingToken;
import com.dialog.server.domain.Notification;
import com.dialog.server.domain.NotificationType;
import com.dialog.server.domain.OnlineDiscussion;
import com.dialog.server.domain.User;
import com.dialog.server.dto.comment.request.DiscussionCommentCreateRequest;
import com.dialog.server.dto.notification.request.NotificationPageRequest;
import com.dialog.server.dto.notification.resposne.MyTokenResponse;
import com.dialog.server.dto.notification.resposne.NotificationPageResponse;
import com.dialog.server.dto.notification.resposne.NotificationPollingResponse;
import com.dialog.server.dto.notification.resposne.NotificationResponse;
import com.dialog.server.dto.notification.resposne.TokenCreationResponse;
import com.dialog.server.event.NotificationCreatedEvent;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.MessagingTokenRepository;
import com.dialog.server.repository.NotificationRepository;
import com.dialog.server.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.async.DeferredResult;

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

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private DiscussionCommentRepository discussionCommentRepository;

    @Autowired
    private DiscussionCommentService discussionCommentService;

    @Autowired
    private EntityManager entityManager;

    @MockitoBean
    private FcmService fcmService;

    @MockitoBean
    private S3Uploader s3Uploader;

    @MockitoBean
    private S3Config s3Config;

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
    @DisplayName("토론 게시글에 새로운 댓글 작성 시 실시간 알림 발송 - 성공")
    void whenNewCommentOnDiscussion_thenDiscussionAuthorReceivesNotification() {
        // given
        // testUser가 토론 게시글 작성자, anotherUser가 댓글 작성자
        Discussion discussion = OnlineDiscussion.builder()
                .title("테스트 토론")
                .content("내용입니다.")
                .category(Category.BACKEND)
                .summary(null)
                .author(testUser)
                .endDate(LocalDate.now().plusDays(1))
                .build();

        Discussion savedDiscussion = discussionRepository.save(discussion);

        // testUser가 알림을 받기 위해 polling 시작
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult
                = new DeferredResult<>(3_000L);
        String sessionId = "test-session-1";
        notificationService.pollNotifications(testUser.getId(), sessionId, null, deferredResult);

        // when
        // anotherUser가 댓글 작성
        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "새로운 댓글입니다.", savedDiscussion.getId(), null
        );
        discussionCommentService.createComment(request, anotherUser.getId());

        // then
        List<Notification> notifications = notificationRepository.findAllByReceiverAndIdGreaterThanOrderByCreatedAtAsc(
                testUser, 0L);
        Long unreadCount = notificationRepository.countByReceiverAndIsReadFalse(testUser);
        notificationService.handleNotificationEvent(new NotificationCreatedEvent(notifications.get(0), unreadCount));

        ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>> responseEntity =
                (ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>) deferredResult.getResult();
        ApiSuccessResponse<NotificationPollingResponse> apiResponse = responseEntity.getBody();
        NotificationPollingResponse pollingResponse = apiResponse.data();
        NotificationResponse notification = pollingResponse.notifications().get(0);

        assertAll(
            () -> assertThat(deferredResult.hasResult()).isTrue(),
            () -> assertThat(pollingResponse.notifications()).hasSize(1),
            () -> assertThat(notification.senderId()).isEqualTo(anotherUser.getId()),
            () -> assertThat(notification.type()).isEqualTo(NotificationType.DISCUSSION_COMMENT),
            () -> assertThat(notification.isRead()).isFalse()
        );
    }

    @Test
    @DisplayName("기존 댓글에 답글 작성 시 실시간 알림 발송 - 성공")
    void whenNewReplyToComment_thenCommentAuthorReceivesNotification() {
        // given
        // testUser: 토론 작성자, anotherUser: 부모 댓글 작성자, replyAuthor: 답글 작성자
        User replyAuthor = User.builder().oauthId("reply-author-789").nickname("답글 작성자").build();
        userRepository.save(replyAuthor);

        Discussion discussion = OnlineDiscussion.builder()
                .title("테스트 토론")
                .content("내용입니다.")
                .category(Category.BACKEND)
                .summary(null)
                .author(testUser)
                .endDate(LocalDate.now().plusDays(1))
                .build();
        discussionRepository.save(discussion);

        DiscussionComment parentComment = DiscussionComment.builder()
                .discussion(discussion)
                .author(anotherUser)
                .content("부모 댓글입니다.")
                .build();
        discussionCommentRepository.save(parentComment);

        // anotherUser(부모 댓글 작성자)가 알림을 받기 위해 polling 시작
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult
                = new DeferredResult<>(3_000L);
        String sessionId = "test-session-2";
        notificationService.pollNotifications(anotherUser.getId(), sessionId, null, deferredResult);

        // when
        // replyAuthor가 anotherUser의 댓글에 답글 작성
        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "답글입니다.", discussion.getId(), parentComment.getId()
        );
        discussionCommentService.createComment(request, replyAuthor.getId());

        // then
        List<Notification> notifications = notificationRepository.findAllByReceiverAndIdGreaterThanOrderByCreatedAtAsc(
                anotherUser, 0L);
        Long unreadCount = notificationRepository.countByReceiverAndIsReadFalse(anotherUser);
        notificationService.handleNotificationEvent(new NotificationCreatedEvent(notifications.get(0), unreadCount));

        ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>> responseEntity =
                (ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>) deferredResult.getResult();
        ApiSuccessResponse<NotificationPollingResponse> apiResponse = responseEntity.getBody();
        NotificationPollingResponse pollingResponse = apiResponse.data();
        NotificationResponse notification = pollingResponse.notifications().get(0);

        assertAll(
                () -> assertThat(deferredResult.hasResult()).isTrue(),
                () -> assertThat(pollingResponse.notifications()).hasSize(1),
                () -> assertThat(notification.senderId()).isEqualTo(replyAuthor.getId()),
                () -> assertThat(notification.type()).isEqualTo(NotificationType.COMMENT_REPLY),
                () -> assertThat(notification.isRead()).isFalse()
        );
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
    @DisplayName("알림 목록 페이징 조회 - 두 번째 페이지 조회 성공")
    void getNotificationPage_SecondPage_Success() {
        // given
        createNotifications(testUser, anotherUser, 25);
        NotificationPageRequest request = new NotificationPageRequest(1, 10);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(10),
                () -> assertThat(response.currentPage()).isEqualTo(1),
                () -> assertThat(response.pageSize()).isEqualTo(10),
                () -> assertThat(response.totalElements()).isEqualTo(25),
                () -> assertThat(response.totalPages()).isEqualTo(3)
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 마지막 페이지 조회 (페이지 크기보다 적은 항목)")
    void getNotificationPage_LastPageWithPartialItems_Success() {
        // given
        createNotifications(testUser, anotherUser, 25);
        NotificationPageRequest request = new NotificationPageRequest(2, 10);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(5),
                () -> assertThat(response.currentPage()).isEqualTo(2),
                () -> assertThat(response.pageSize()).isEqualTo(10),
                () -> assertThat(response.totalElements()).isEqualTo(25),
                () -> assertThat(response.totalPages()).isEqualTo(3)
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 빈 목록 조회")
    void getNotificationPage_EmptyList_Success() {
        // given
        NotificationPageRequest request = new NotificationPageRequest(0, 20);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).isEmpty(),
                () -> assertThat(response.currentPage()).isEqualTo(0),
                () -> assertThat(response.pageSize()).isEqualTo(20),
                () -> assertThat(response.totalElements()).isEqualTo(0),
                () -> assertThat(response.totalPages()).isEqualTo(0),
                () -> assertThat(response.unreadCount()).isEqualTo(0L)
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 범위를 벗어난 페이지 조회")
    void getNotificationPage_PageOutOfBounds_ReturnsEmpty() {
        // given
        createNotifications(testUser, anotherUser, 5);
        NotificationPageRequest request = new NotificationPageRequest(10, 20);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).isEmpty(),
                () -> assertThat(response.currentPage()).isEqualTo(10),
                () -> assertThat(response.totalElements()).isEqualTo(5),
                () -> assertThat(response.totalPages()).isEqualTo(1)
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 최신순 정렬 확인")
    void getNotificationPage_OrderByCreatedAtDesc_Success() {
        // given
        List<Notification> notifications = createNotifications(testUser, anotherUser, 3);
        NotificationPageRequest request = new NotificationPageRequest(0, 10);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        List<NotificationResponse> notificationResponses = response.notifications();
        assertAll(
                () -> assertThat(notificationResponses).hasSize(3),
                () -> assertThat(notificationResponses.get(0).createdAt())
                        .isAfterOrEqualTo(notificationResponses.get(1).createdAt()),
                () -> assertThat(notificationResponses.get(1).createdAt())
                        .isAfterOrEqualTo(notificationResponses.get(2).createdAt())
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 안읽은 알림 개수 정확성 확인")
    void getNotificationPage_UnreadCountAccuracy_Success() {
        // given
        List<Notification> notifications = createNotifications(testUser, anotherUser, 10);

        // 처음 5개만 읽음 처리
        IntStream.range(0, 5).forEach(i -> notifications.get(i).read());

        NotificationPageRequest request = new NotificationPageRequest(0, 20);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(10),
                () -> assertThat(response.unreadCount()).isEqualTo(5L),
                () -> assertThat(response.notifications().stream().filter(n -> !n.isRead()).count()).isEqualTo(5L)
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 다른 사용자의 알림은 조회되지 않음")
    void getNotificationPage_OnlyUserNotifications_Success() {
        // given
        createNotifications(testUser, anotherUser, 5);
        createNotifications(anotherUser, testUser, 3);

        NotificationPageRequest request = new NotificationPageRequest(0, 20);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(5),
                () -> assertThat(response.totalElements()).isEqualTo(5),
                () -> assertThat(response.notifications())
                        .allMatch(n -> n.senderId().equals(anotherUser.getId()))
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 존재하지 않는 사용자")
    void getNotificationPage_UserNotFound_ThrowsException() {
        // given
        Long nonExistentUserId = 999L;
        NotificationPageRequest request = new NotificationPageRequest(0, 20);

        // when & then
        assertThatThrownBy(() -> notificationService.getNotificationPage(nonExistentUserId, request))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 단일 알림 조회")
    void getNotificationPage_SingleNotification_Success() {
        // given
        createNotifications(testUser, anotherUser, 1);
        NotificationPageRequest request = new NotificationPageRequest(0, 20);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(1),
                () -> assertThat(response.totalElements()).isEqualTo(1),
                () -> assertThat(response.totalPages()).isEqualTo(1)
        );
    }

    @Test
    @DisplayName("알림 목록 페이징 조회 - 정확히 페이지 크기만큼의 알림")
    void getNotificationPage_ExactlyPageSize_Success() {
        // given
        createNotifications(testUser, anotherUser, 20);
        NotificationPageRequest request = new NotificationPageRequest(0, 20);

        // when
        NotificationPageResponse response = notificationService.getNotificationPage(testUser.getId(), request);

        // then
        assertAll(
                () -> assertThat(response.notifications()).hasSize(20),
                () -> assertThat(response.currentPage()).isEqualTo(0),
                () -> assertThat(response.totalElements()).isEqualTo(20),
                () -> assertThat(response.totalPages()).isEqualTo(1)
        );
    }

    @Test
    @DisplayName("NotificationPageRequest - null page는 0으로 기본값 설정")
    void notificationPageRequest_NullPage_DefaultsToZero() {
        // given & when
        NotificationPageRequest request = new NotificationPageRequest(null, 10);

        // then
        assertThat(request.page()).isEqualTo(0);
    }

    @Test
    @DisplayName("NotificationPageRequest - 음수 page는 0으로 보정")
    void notificationPageRequest_NegativePage_DefaultsToZero() {
        // given & when
        NotificationPageRequest request = new NotificationPageRequest(-5, 10);

        // then
        assertThat(request.page()).isEqualTo(0);
    }

    @Test
    @DisplayName("NotificationPageRequest - null size는 20으로 기본값 설정")
    void notificationPageRequest_NullSize_DefaultsToTwenty() {
        // given & when
        NotificationPageRequest request = new NotificationPageRequest(0, null);

        // then
        assertThat(request.size()).isEqualTo(20);
    }

    @Test
    @DisplayName("NotificationPageRequest - 0 이하 size는 20으로 기본값 설정")
    void notificationPageRequest_ZeroOrNegativeSize_DefaultsToTwenty() {
        // given & when
        NotificationPageRequest requestZero = new NotificationPageRequest(0, 0);
        NotificationPageRequest requestNegative = new NotificationPageRequest(0, -10);

        // then
        assertAll(
                () -> assertThat(requestZero.size()).isEqualTo(20),
                () -> assertThat(requestNegative.size()).isEqualTo(20)
        );
    }

    @Test
    @DisplayName("NotificationPageRequest - size 50 초과 시 50으로 제한")
    void notificationPageRequest_SizeExceedsFifty_CapsAtFifty() {
        // given & when
        NotificationPageRequest request = new NotificationPageRequest(0, 100);

        // then
        assertThat(request.size()).isEqualTo(50);
    }

    @Test
    @DisplayName("NotificationPageRequest - 정상적인 page와 size는 그대로 유지")
    void notificationPageRequest_ValidValues_KeepsOriginal() {
        // given & when
        NotificationPageRequest request = new NotificationPageRequest(2, 15);

        // then
        assertAll(
                () -> assertThat(request.page()).isEqualTo(2),
                () -> assertThat(request.size()).isEqualTo(15)
        );
    }

    @Test
    @DisplayName("NotificationPageRequest - 경계값 테스트 (size = 50)")
    void notificationPageRequest_BoundaryValue_SizeFifty() {
        // given & when
        NotificationPageRequest request = new NotificationPageRequest(0, 50);

        // then
        assertThat(request.size()).isEqualTo(50);
    }

    @Test
    @DisplayName("NotificationPageRequest - 경계값 테스트 (size = 51)")
    void notificationPageRequest_BoundaryValue_SizeFiftyOne() {
        // given & when
        NotificationPageRequest request = new NotificationPageRequest(0, 51);

        // then
        assertThat(request.size()).isEqualTo(50);
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
    @DisplayName("알림 읽음 처리 - 이미 읽은 알림 재처리 (멱등성)")
    void updateNotificationAsRead_AlreadyRead_Success() {
        // given
        Notification notification = Notification.builder()
                .sender(anotherUser)
                .receiver(testUser)
                .type(NotificationType.DISCUSSION_COMMENT)
                .build();
        Notification savedNotification = notificationRepository.save(notification);
        savedNotification.read();

        // when
        notificationService.updateNotificationAsRead(testUser.getId(), savedNotification.getId());

        // then
        Notification updatedNotification = notificationRepository.findById(savedNotification.getId()).orElseThrow();
        assertThat(updatedNotification.isRead()).isTrue();
    }

    @Test
    @DisplayName("알림 읽음 처리 - 존재하지 않는 사용자")
    void updateNotificationAsRead_UserNotFound() {
        // given
        Notification notification = Notification.builder()
                .sender(anotherUser)
                .receiver(testUser)
                .type(NotificationType.DISCUSSION_COMMENT)
                .build();
        Notification savedNotification = notificationRepository.save(notification);
        Long nonExistentUserId = 999L;

        // when & then
        assertThatThrownBy(() -> notificationService.updateNotificationAsRead(nonExistentUserId, savedNotification.getId()))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("알림 읽음 처리 - 다른 사용자의 알림 접근 시도")
    void updateNotificationAsRead_UnauthorizedAccess() {
        // given
        Notification notification = Notification.builder()
                .sender(anotherUser)
                .receiver(testUser)
                .type(NotificationType.DISCUSSION_COMMENT)
                .build();
        Notification savedNotification = notificationRepository.save(notification);

        // when & then
        assertThatThrownBy(() -> notificationService.updateNotificationAsRead(anotherUser.getId(), savedNotification.getId()))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOTIFICATION_NOT_FOUND);
    }

    @Test
    @DisplayName("알림 읽음 처리 - 존재하지 않는 알림")
    void updateNotificationAsRead_NotificationNotFound() {
        // given
        Long nonExistentNotificationId = 999L;

        // when & then
        assertThatThrownBy(() -> notificationService.updateNotificationAsRead(testUser.getId(), nonExistentNotificationId))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOTIFICATION_NOT_FOUND);
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 성공")
    void updateAllNotificationAsRead_Success() {
        // given
        createNotifications(testUser, anotherUser, 10);

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

    @Test
    @DisplayName("모든 알림 읽음 처리 - 멱등성 (이미 모두 읽음)")
    void updateAllNotificationAsRead_AlreadyAllRead_Idempotent() {
        // given
        List<Notification> notifications = createNotifications(testUser, anotherUser, 5);
        notifications.forEach(Notification::read);

        // when
        notificationService.updateAllNotificationAsRead(testUser.getId());

        // then
        assertThat(notificationRepository.countByReceiverAndIsReadFalse(testUser))
                .isEqualTo(0L);
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 일부만 읽음 상태")
    void updateAllNotificationAsRead_PartiallyRead_Success() {
        // given
        List<Notification> notifications = createNotifications(testUser, anotherUser, 10);
        IntStream.range(0, 5).forEach(i -> notifications.get(i).read());

        Long initialUnreadCount = notificationRepository.countByReceiverAndIsReadFalse(testUser);
        assertThat(initialUnreadCount).isEqualTo(5L);

        // when
        notificationService.updateAllNotificationAsRead(testUser.getId());

        // then
        assertThat(notificationRepository.countByReceiverAndIsReadFalse(testUser))
                .isEqualTo(0L);
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 존재하지 않는 사용자")
    void updateAllNotificationAsRead_UserNotFound() {
        // given
        Long nonExistentUserId = 999L;

        // when & then
        assertThatThrownBy(() -> notificationService.updateAllNotificationAsRead(nonExistentUserId))
                .isInstanceOf(DialogException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 다른 사용자 알림 영향 없음")
    void updateAllNotificationAsRead_OnlyUserNotifications_OtherUserUnaffected() {
        // given
        createNotifications(testUser, anotherUser, 5);
        createNotifications(anotherUser, testUser, 3);

        // when
        notificationService.updateAllNotificationAsRead(testUser.getId());

        // then
        assertAll(
                () -> assertThat(notificationRepository.countByReceiverAndIsReadFalse(testUser))
                        .isEqualTo(0L),
                () -> assertThat(notificationRepository.countByReceiverAndIsReadFalse(anotherUser))
                        .isEqualTo(3L)
        );
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 알림이 없는 경우")
    void updateAllNotificationAsRead_NoNotifications_Success() {
        // when
        notificationService.updateAllNotificationAsRead(testUser.getId());

        // then
        assertThat(notificationRepository.countByReceiverAndIsReadFalse(testUser))
                .isEqualTo(0L);
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 활성 폴링 연결에 알림 전송")
    void updateAllNotificationAsRead_NotifiesActivePollers() throws Exception {
        // given
        createNotifications(testUser, anotherUser, 10);

        // testUser가 폴링 시작
        DeferredResult<ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>> deferredResult
                = new DeferredResult<>(30_000L);
        String sessionId = "test-session-bulk";
        notificationService.pollNotifications(testUser.getId(), sessionId, null, deferredResult);

        // when
        notificationService.updateAllNotificationAsRead(testUser.getId());

        // then
        assertThat(deferredResult.hasResult()).isTrue();

        ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>> response =
                (ResponseEntity<ApiSuccessResponse<NotificationPollingResponse>>) deferredResult.getResult();
        NotificationPollingResponse pollingResponse = response.getBody().data();

        assertAll(
                () -> assertThat(pollingResponse.unreadCount()).isEqualTo(0L),
                () -> assertThat(pollingResponse.notifications()).isEmpty()
        );
    }

    @Test
    @DisplayName("모든 알림 읽음 처리 - 폴링 연결 없으면 예외 없이 성공")
    void updateAllNotificationAsRead_NoActivePollers_Success() {
        // given
        createNotifications(testUser, anotherUser, 5);
        // 폴링 연결 없음

        // when & then
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() ->
                notificationService.updateAllNotificationAsRead(testUser.getId())
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
