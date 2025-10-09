package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.OfflineDiscussion;
import com.dialog.server.domain.OnlineDiscussion;
import com.dialog.server.domain.Role;
import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;
import com.dialog.server.dto.response.DiscussionSummaryCreateResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@ActiveProfiles("test")
@SpringBootTest
@Transactional
class DiscussionSummaryServiceTest {

    @Autowired
    private DiscussionSummaryService discussionSummaryService;

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private DiscussionCommentRepository discussionCommentRepository;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private AiClient aiClient;

    @BeforeEach
    void setUp() {
        when(aiClient.execute(anyString(), anyString(), anyMap()))
                .thenReturn("멀티 모듈 구조 도입에 대한 토론 요약입니다. "
                        + "팀원의 경험과 관심도를 고려해 결정하는 것이 중요하며, "
                        + "모놀리식으로 시작하여 필요시 멀티 모듈로 발전시키는 점진적 접근이 권장됩니다.");
    }

    private User createUser(String oauthId, String nickname) {
        User user = User.builder()
                .oauthId(oauthId)
                .nickname(nickname)
                .track(Track.BACKEND)
                .webPushNotification(true)
                .role(Role.USER)
                .build();
        return userRepository.save(user);
    }

    private Discussion createOfflineDiscussion(User author) {
        LocalDateTime now = LocalDateTime.now();
        return OfflineDiscussion.withNoValidateOf(
                "오프라인 토론 제목",
                "오프라인 토론 내용입니다.",
                Category.BACKEND,
                "",
                author,
                now.plusDays(1),
                now.plusDays(1).plusHours(2),
                "서울시 강남구",
                5,
                1
        );
    }

    private Discussion createTestDiscussion() {
        // 테스트용 User 생성
        User author = User.builder()
                .oauthId("hippo-oauth-id")
                .nickname("히포")
                .track(Track.BACKEND)
                .webPushNotification(true)
                .role(Role.USER)
                .build();
        userRepository.save(author);

        User murphy = User.builder()
                .oauthId("murphy-oauth-id")
                .nickname("머피")
                .track(Track.BACKEND)
                .webPushNotification(true)
                .role(Role.USER)
                .build();
        userRepository.save(murphy);

        User wade = User.builder()
                .oauthId("wade-oauth-id")
                .nickname("웨이드")
                .track(Track.BACKEND)
                .webPushNotification(true)
                .role(Role.USER)
                .build();
        userRepository.save(wade);

        User kangsan = User.builder()
                .oauthId("kangsan-oauth-id")
                .nickname("강산")
                .track(Track.BACKEND)
                .webPushNotification(true)
                .role(Role.USER)
                .build();
        userRepository.save(kangsan);

        // 테스트용 OnlineDiscussion 생성
        LocalDateTime now = LocalDateTime.now();
        Discussion discussion = OnlineDiscussion.withNoValidateOf(
                "admin 기능을 개발하기 위해 멀티 모듈 구조를 도입하는 것에 대한 의견",
                "admin 기능 개발을 위해 멀티 모듈을 도입하여 core, api, admin 모듈로 분리하는 것이 좋을지에 대한 토론입니다. "
                        + "물리적으로 다른 서버에서 운영하여 트래픽을 독립적으로 관리하고, 고가용성 환경에서 리소스를 절약할 수 있다는 장점이 있지만, "
                        + "현재 단계에서는 오버 엔지니어링일 수 있다는 우려도 있습니다.",
                Category.BACKEND,
                "",
                author,
                now.plusDays(1).toLocalDate()
        );
        Discussion savedDiscussion = discussionRepository.save(discussion);

        // 테스트용 DiscussionComment 생성
        DiscussionComment murphyComment1 = DiscussionComment.builder()
                .content("저는 멀티모듈은 admin 기능 개발에 반드시 필요한 요소는 아니고, 모놀리식 구조에서도 충분히 구현 가능하다고 생각합니다! "
                        + "그래서 저라면 팀원분들의 관심도나 관련 경험을 고려해 결정할 것 같습니다 ㅎㅎㅎ")
                .discussion(discussion)
                .author(murphy)
                .build();
        discussionCommentRepository.save(murphyComment1);

        DiscussionComment hippoReply1 = DiscussionComment.builder()
                .content("먼저 토론에 참여해주셔서 감사드려요 ㅎ 머피 의견처럼 팀원의 관심도나 관련 경험을 고려하여 결정하는 것이 가장 중요하다는 점은 항상 고정인 것 같아요! "
                        + "설득력을 더 높이기 위해서 모놀리식 구조를 통해서 admin을 구현하고 추가적으로 욕심을 살짝 부려서 멀티 모듈식으로 발전 시켜보고 싶다는 방향으로 의견을 내보는 것이 "
                        + "팀원들의 공감을 더 많이 받을 수 있는 방향이라는 생각이 들어요. 혹시 머피는 admin 이외에 다른 기능 개발에서 멀티 모듈을 통해 분리한 경험이 있으신가요??")
                .discussion(discussion)
                .author(author)
                .parentDiscussionComment(murphyComment1)
                .build();
        discussionCommentRepository.save(hippoReply1);

        DiscussionComment murphyReply1 = DiscussionComment.builder()
                .content("저는 지금까지 멀티 모듈 구성을 네 번 정도 경험했는데요. 처음 두 번은 Spring Batch를 다루면서 도입했어요. "
                        + "이후 두 번은 라이브러리를 만들면서였는데, 이건 프로젝트와는 성격이 완전히 달랐습니다. "
                        + "결론적으로는, 엄청 재밌었지만 동시에 엄청 힘들었습니다. 정답도 없고, 사람마다 멀티 모듈을 바라보는 시선이 다 제각각이거든요.")
                .discussion(discussion)
                .parentDiscussionComment(murphyComment1)
                .author(murphy)
                .build();
        discussionCommentRepository.save(murphyReply1);

        DiscussionComment wadeComment1 = DiscussionComment.builder()
                .content("대중적으로 말하는 모듈을 분리해서 얻는 장점보다, 현재 진행하고 있는 프로젝트에서 모듈을 분리할 필요성을 어디에서 느끼시고 있는지가 궁금해요! "
                        + "현재 내 프로젝트에서 모듈을 분리했을 때 어떤 장점이 있을까? 고민해보셨나요~!? "
                        + "위 글에서는 서버를 분리한다고 했는데, 멀티 모듈을 도입해서 admin서버, api서버 두 서버를 운영하실 예정인가요?")
                .discussion(discussion)
                .author(wade)
                .build();
        discussionCommentRepository.save(wadeComment1);

        DiscussionComment hippoReply2 = DiscussionComment.builder()
                .content("저도 멀티 모듈에 대해서 자세히 알지 못하고 막연히 재밌어 보이기 때문에 도입하려는 이유가 제일 크다고 생각해요! "
                        + "현재는 학습을 하는 과정이기 때문에 기술의 장점을 먼저 보고 프로젝트에 도입을 하자는 도전적인 결정을 하는 것도 좋다고 생각해요! "
                        + "하나의 레포에 제작한 admin과 api라는 각기 다른 모듈이 공통된 core 모듈을 사용해서 실행 가능한 하나의 jar 파일을 만들어 내는 과정과 "
                        + "이를 이용해서 각기 다른 서버에 운영 배포하는 흐름을 한번 직접 구현해보고 싶었기 때문입니다.")
                .discussion(discussion)
                .author(author)
                .parentDiscussionComment(wadeComment1)
                .build();
        discussionCommentRepository.save(hippoReply2);

        DiscussionComment wadeReply1 = DiscussionComment.builder()
                .content("멀티 모듈의 장단점을 막연하게 찾아보고 도입하면, 우리 프로젝트의 모듈을 분리하는 단계에서 헷갈릴 수 있을 것이라 생각했습니다. "
                        + "우리 프로젝트에서 모듈을 분리하는 기준, 목적을 세우면 모듈에 대해 더 잘 이해하고 효율적이게 분리할 수 있을 것 같았습니다. "
                        + "예를 들어, 전체 테스트 시간 단축, 배포 시간 단축, 의존성 관리 명확화, 패키지간 완전한 격리 등의 목적이 있을 수 있습니다. "
                        + "저도 여유가 있으면 멀티 모듈 도입하는 것이 좋다고 생각합니다. 하지만 같이 진행하는 팀원들과 함께 학습한 뒤 진행하면 좋을 것 같습니다.")
                .discussion(discussion)
                .author(wade)
                .parentDiscussionComment(wadeComment1)
                .build();
        discussionCommentRepository.save(wadeReply1);

        DiscussionComment kangsanComment = DiscussionComment.builder()
                .content("재밌다. 저도 재미로 멀티 모듈 하는 중")
                .discussion(discussion)
                .author(kangsan)
                .build();
        discussionCommentRepository.save(kangsanComment);

        return savedDiscussion;
    }

    @Nested
    @DisplayName("generateAndUpdateSummaryBy(Long discussionId, Long userId) 테스트")
    class GenerateAndUpdateSummaryByIdTest {

        @Test
        @DisplayName("성공: 작성자가 온라인 토론 요약 생성")
        void generateSummary_Success_WhenAuthorRequestsOnlineDiscussion() {
            // given
            Discussion discussion = createTestDiscussion();
            User author = discussion.getAuthor();

            // when
            DiscussionSummaryCreateResponse response = discussionSummaryService
                    .generateAndUpdateSummaryBy(discussion.getId(), author.getId());

            // then
            assertThat(response).isNotNull();
            assertThat(response.summary()).isNotBlank();
            assertThat(discussion.hasSummary()).isTrue();
            System.out.println("생성된 요약: " + response.summary());
        }

        @Test
        @DisplayName("실패: 다른 사용자가 토론 요약 생성 시도")
        void generateSummary_Fail_WhenUnauthorizedUser() {
            // given
            Discussion discussion = createTestDiscussion();
            User otherUser = createUser("other-oauth-id", "다른사용자");

            // when & then
            assertThatThrownBy(() ->
                    discussionSummaryService.generateAndUpdateSummaryBy(discussion.getId(), otherUser.getId())
            )
                    .isInstanceOf(DialogException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.UNAUTHORIZED_DISCUSSION_SUMMARY);
        }

        @Test
        @DisplayName("실패: 이미 요약이 존재하는 토론")
        void generateSummary_Fail_WhenSummaryAlreadyExists() {
            // given
            Discussion discussion = createTestDiscussion();
            User author = discussion.getAuthor();

            // 첫 번째 요약 생성
            discussionSummaryService.generateAndUpdateSummaryBy(discussion.getId(), author.getId());

            // when & then
            assertThatThrownBy(() ->
                    discussionSummaryService.generateAndUpdateSummaryBy(discussion.getId(), author.getId())
            )
                    .isInstanceOf(DialogException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ALREADY_DISCUSSION_SUMMARY);
        }

        @Test
        @DisplayName("실패: 오프라인 토론 요약 시도")
        void generateSummary_Fail_WhenOfflineDiscussion() {
            // given
            User author = createUser("author-oauth-id", "작성자");
            Discussion offlineDiscussion = createOfflineDiscussion(author);
            discussionRepository.save(offlineDiscussion);

            // when & then
            assertThatThrownBy(() ->
                    discussionSummaryService.generateAndUpdateSummaryBy(offlineDiscussion.getId(), author.getId())
            )
                    .isInstanceOf(DialogException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CANNOT_SUMMARIZE_OFFLINE_DISCUSSION);
        }

        @Test
        @DisplayName("실패: 존재하지 않는 토론")
        void generateSummary_Fail_WhenDiscussionNotFound() {
            // given
            Long nonExistentDiscussionId = 99999L;
            Long userId = 1L;

            // when & then
            assertThatThrownBy(() ->
                    discussionSummaryService.generateAndUpdateSummaryBy(nonExistentDiscussionId, userId)
            )
                    .isInstanceOf(DialogException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FOUND_DISCUSSION);
        }
    }

    @Nested
    @DisplayName("generateAndUpdateSummaryBy(Discussion) 테스트 - 스케줄러용")
    class GenerateAndUpdateSummaryByEntityTest {

        @Test
        @DisplayName("성공: 온라인 토론 요약 생성")
        void generateSummary_Success_ForScheduler() {
            // given
            Discussion discussion = createTestDiscussion();

            // when
            discussionSummaryService.generateAndUpdateSummaryBy(discussion);

            // then
            assertThat(discussion.hasSummary()).isTrue();
            assertThat(discussion.getSummary()).isNotBlank();
            System.out.println("생성된 요약: " + discussion.getSummary());
        }

        @Test
        @DisplayName("실패: 이미 요약이 존재하는 토론")
        void generateSummary_Fail_WhenSummaryAlreadyExists() {
            // given
            Discussion discussion = createTestDiscussion();

            // 첫 번째 요약 생성
            discussionSummaryService.generateAndUpdateSummaryBy(discussion);

            // when & then
            assertThatThrownBy(() ->
                    discussionSummaryService.generateAndUpdateSummaryBy(discussion)
            )
                    .isInstanceOf(DialogException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.ALREADY_DISCUSSION_SUMMARY);
        }

        @Test
        @DisplayName("실패: 오프라인 토론 요약 시도")
        void generateSummary_Fail_WhenOfflineDiscussion() {
            // given
            User author = createUser("author-oauth-id", "작성자");
            Discussion offlineDiscussion = createOfflineDiscussion(author);

            // when & then
            assertThatThrownBy(() ->
                    discussionSummaryService.generateAndUpdateSummaryBy(offlineDiscussion)
            )
                    .isInstanceOf(DialogException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CANNOT_SUMMARIZE_OFFLINE_DISCUSSION);
        }
    }
}
