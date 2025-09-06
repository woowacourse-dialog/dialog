package com.dialog.server.service;

import static com.dialog.server.dto.request.SearchType.AUTHOR_NICKNAME;
import static com.dialog.server.dto.request.SearchType.TITLE_OR_CONTENT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.SoftAssertions.assertSoftly;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionStatus;
import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.User;
import com.dialog.server.dto.request.DiscussionCreateRequest;
import com.dialog.server.dto.request.DiscussionCursorPageRequest;
import com.dialog.server.dto.request.DiscussionUpdateRequest;
import com.dialog.server.dto.response.DiscussionCreateResponse;
import com.dialog.server.dto.response.DiscussionCursorPageResponse;
import com.dialog.server.dto.response.DiscussionDetailResponse;
import com.dialog.server.dto.response.DiscussionPreviewResponse;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
@Transactional
@ActiveProfiles("test")
@SpringBootTest
class DiscussionServiceTest {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DiscussionRepository discussionRepository;
    @Autowired
    private DiscussionService discussionService;
    @Autowired
    private ProfileImageRepository profileImageRepository;

    @Test
    void 토론_게시글을_저장할_수_있다() {
        // given & when
        User savedUser = userRepository.save(createUser());
        DiscussionCreateResponse response = saveDiscussion(savedUser);
        // then
        assertThat(discussionRepository.findById(response.discussionId()).isPresent());
    }

    @Test
    void 토론_게시글을_단일_조회할_수_있다() {
        // given & when
        User savedUser = userRepository.save(createUser());
        DiscussionCreateResponse response = saveDiscussion(savedUser);
        // then
        assertThat(discussionRepository.findById(response.discussionId()).isPresent());
    }

    @Test
    void 토론_게시글을_삭제할_수_있다() {
        // given
        User savedUser = userRepository.save(createUser());
        DiscussionCreateResponse response = saveDiscussion(savedUser);
        // when
        discussionService.deleteDiscussion(response.discussionId());
        Discussion discussion = discussionRepository.findById(response.discussionId()).orElseThrow();
        // then
        assertThat(discussion.getDeletedAt()).isNotNull();
    }

    @Test
    void 토론_게시글을_수정할_수_있다() {
        // given
        User savedUser = userRepository.save(createUser());
        profileImageRepository.save(createProfileImage(savedUser));
        DiscussionCreateResponse response = saveDiscussion(savedUser);
        DiscussionUpdateRequest request = new DiscussionUpdateRequest(
                "modified title",
                "test content",
                LocalDateTime.now(),
                LocalDateTime.now().plusMinutes(30),
                "test place",
                6,
                Category.BACKEND,
                "test summary"
        );
        // when
        discussionService.updateDiscussion(response.discussionId(), request);
        DiscussionDetailResponse modifiedDiscussion = discussionService.getDiscussionById(response.discussionId());
        // then
        assertThat(modifiedDiscussion.title()).isEqualTo(request.title());
    }

    @Test
    void 페이지에_맞는_토론_게시글_목록을_가져올_수_있다() {
        // given
        User user = userRepository.save(createUser());
        int totalCount = 20;
        int pageSize = 5;

        // 여러 토론 게시글 생성 (시간 간격을 두고)
        for (int i = 0; i < totalCount; i++) {
            DiscussionCreateRequest request = createDiscussionRequest(
                    "테스트 제목 " + (i + 1),
                    "테스트 내용입니다",
                    LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(15),
                    LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(30),
                    "테스트 장소",
                    5,
                    Category.BACKEND,
                    "테스트 요약"
            );

            discussionService.createDiscussion(request, user.getId());

            // 생성 시간에 차이를 두기 위해 약간의 지연 추가
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // when
        // 첫 번째 페이지 조회 (cursor 없음)
        DiscussionCursorPageRequest firstPageRequest = new DiscussionCursorPageRequest(null, pageSize);
        DiscussionCursorPageResponse<DiscussionPreviewResponse> firstPage =
                discussionService.getDiscussionsPage(null, null, firstPageRequest);

        // 다음 페이지 조회 (첫 페이지의 nextCursor 사용)
        DiscussionCursorPageRequest secondPageRequest =
                new DiscussionCursorPageRequest(firstPage.nextCursor(), pageSize);
        DiscussionCursorPageResponse<DiscussionPreviewResponse> secondPage =
                discussionService.getDiscussionsPage(null, null, secondPageRequest);

        // then
        // 첫 번째 페이지 검증
        assertThat(firstPage.content()).hasSize(pageSize);
        assertThat(firstPage.hasNext()).isTrue();
        assertThat(firstPage.nextCursor()).isNotNull();

        // 두 번째 페이지 검증
        assertThat(secondPage.content()).hasSize(pageSize);
        assertThat(secondPage.hasNext()).isTrue();
        assertThat(secondPage.nextCursor()).isNotNull();

        // 중복 없이 순서대로 정렬되었는지 확인
        List<Long> firstPageIds = firstPage.content().stream()
                .map(DiscussionPreviewResponse::id)
                .toList();
        List<Long> secondPageIds = secondPage.content().stream()
                .map(DiscussionPreviewResponse::id)
                .toList();

        // 두 페이지 간에 중복이 없는지 확인
        boolean hasOverlap = firstPageIds.stream().anyMatch(secondPageIds::contains);
        assertThat(hasOverlap).isFalse();

        // 정렬 순서 확인 (최신순)
        assertThat(firstPageIds.get(0)).isGreaterThan(firstPageIds.get(firstPageIds.size() - 1));
        assertThat(secondPageIds.get(0)).isGreaterThan(secondPageIds.get(secondPageIds.size() - 1));

        // 첫 페이지의 마지막 ID가 두 번째 페이지의 첫 ID보다 큰지 확인
        assertThat(firstPageIds.get(firstPageIds.size() - 1))
                .isGreaterThan(secondPageIds.get(0));
    }

    @Disabled
    @Test
    void 게시글의_제목이나_본문으로_게시글을_검색한다() {
        // given
        int totalCount = 20;
        int pageSize = 5;
        createDummyDiscussions(totalCount);

        // when
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "홀수", null, null, null, pageSize
        );

        // then
        assertAll(
                () -> assertThat(searched.content()).hasSize(pageSize),
                () -> assertThat(searched.hasNext()).isTrue(),
                () -> assertThat(searched.nextCursor()).isNotNull(),
                () -> assertThat(searched.content().getFirst().title()).contains("19"),
                () -> assertThat(searched.content().getLast().title()).contains("11")
        );
    }

    @Disabled
    @Test
    void 게시글의_제목_또는_본문_검색_시_다음_페이지를_반환한다() {
        // given
        int totalCount = 20;
        int pageSize = 5;
        createDummyDiscussions(totalCount);
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> firstSearch = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "홀수", null, null, null, pageSize
        );

        // when
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "홀수", null, null, firstSearch.nextCursor(), pageSize
        );

        // then
        assertAll(
                () -> assertThat(searched.content()).hasSize(pageSize),
                () -> assertThat(searched.hasNext()).isFalse(),
                () -> assertThat(searched.nextCursor()).isNull(),
                () -> assertThat(searched.content().getFirst().title()).contains("9"),
                () -> assertThat(searched.content().getLast().title()).contains("1")
        );
    }

    @Disabled
    @Test
    void 게시글의_제목_또는_본문_검색_시_마지막_페이지를_반환한다() {
        // given
        int totalCount = 25;
        int pageSize = 5;
        createDummyDiscussions(totalCount);
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> firstSearch = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "홀수", null, null, null, pageSize
        );
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> secondSearch = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "홀수", null, null, firstSearch.nextCursor(), pageSize
        );

        // when
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "홀수", null, null, secondSearch.nextCursor(), pageSize
        );

        // then
        assertAll(
                () -> assertThat(searched.content()).hasSize(3),
                () -> assertThat(searched.hasNext()).isFalse(),
                () -> assertThat(searched.nextCursor()).isNull(),
                () -> assertThat(searched.content().getFirst().title()).contains("5"),
                () -> assertThat(searched.content().getLast().title()).contains("1")
        );
    }

    @Disabled
    @Test
    void 게시글의_작성자_닉네임으로_토론을_검색한다() {
        // given
        int totalCount = 20;
        int pageSize = 5;
        createDummyDiscussions(totalCount);

        // when
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test 2", null, null, null, pageSize
        );

        // then
        assertAll(
                () -> assertThat(searched.content()).hasSize(pageSize),
                () -> assertThat(searched.hasNext()).isTrue(),
                () -> assertThat(searched.nextCursor()).isNotNull(),
                () -> assertThat(searched.content().getFirst().title()).contains("20"),
                () -> assertThat(searched.content().getLast().title()).contains("12")
        );
    }

    @Disabled
    @Test
    void 게시글의_작성자_닉네임으로_검색_시_다음_페이지를_반환한다() {
        // given
        int totalCount = 20;
        int pageSize = 5;
        createDummyDiscussions(totalCount);
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> firstSearch = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test 2", null, null, null, pageSize
        );

        // when
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test 2", null, null, firstSearch.nextCursor(), pageSize
        );

        // then
        assertAll(
                () -> assertThat(searched.content()).hasSize(pageSize),
                () -> assertThat(searched.hasNext()).isFalse(),
                () -> assertThat(searched.nextCursor()).isNull(),
                () -> assertThat(searched.content().getFirst().title()).contains("10"),
                () -> assertThat(searched.content().getLast().title()).contains("2")
        );
    }

    @Disabled
    @Test
    void 게시글의_작성자_닉네임으로_검색_시_마지막_페이지를_반환한다() {
        // given
        int totalCount = 25;
        int pageSize = 5;
        createDummyDiscussions(totalCount);
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> firstSearch = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test 2", null, null, null, pageSize
        );
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> secondSearch = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test 2", null, null, firstSearch.nextCursor(), pageSize
        );

        // when
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test 2", null, null, secondSearch.nextCursor(), pageSize
        );

        // then
        assertAll(
                () -> assertThat(searched.content()).hasSize(2),
                () -> assertThat(searched.hasNext()).isFalse(),
                () -> assertThat(searched.nextCursor()).isNull(),
                () -> assertThat(searched.content().getFirst().title()).contains("4"),
                () -> assertThat(searched.content().getLast().title()).contains("2")
        );
    }

    @Test
    void 토론_작성자를_통해서_커서_기반으로_토론을_조회할_수_있다() {
        //given
        User user1 = userRepository.save(createUser());
        User user2 = userRepository.save(createUser());
        Discussion discussion1 = discussionRepository.save(createDiscussion(user1));
        Discussion discussion2 = discussionRepository.save(createDiscussion(user1));
        discussionRepository.save(createDiscussion(user2));
        Discussion discussion4 = discussionRepository.save(createDiscussion(user1));
        Discussion discussion5 = discussionRepository.save(createDiscussion(user1));

        //when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result1 = discussionService.getDiscussionByAuthorId(
                new DiscussionCursorPageRequest(null, 2), user1.getId());
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result2 = discussionService.getDiscussionByAuthorId(
                new DiscussionCursorPageRequest(result1.nextCursor(), 2), user1.getId());

        //then
        assertSoftly(softly -> {
            softly.assertThat(result1.content()).hasSize(2);
            softly.assertThat(result1.hasNext()).isTrue();
            softly.assertThat(result1.content()).extracting("id")
                    .containsExactly(discussion5.getId(), discussion4.getId());
            softly.assertThat(result2.content()).hasSize(2);
            softly.assertThat(result2.hasNext()).isFalse();
            softly.assertThat(result2.content()).extracting("id")
                    .containsExactly(discussion2.getId(), discussion1.getId());
        });
    }

    @Test
    void 카테고리_필터로_토론_게시글을_조회할_수_있다() {
        // given
        createFilterTestData();
        List<String> categories = List.of("backend", "frontend");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.getDiscussionsPage(
                Category.fromValues(categories), null, new DiscussionCursorPageRequest(null, 10)
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(4),
                () -> assertThat(result.content()).allMatch(discussion ->
                        discussion.category().equals(Category.BACKEND) ||
                                discussion.category().equals(Category.FRONTEND))
        );
    }

    @Test
    void 토론_상태_필터로_토론_게시글을_조회할_수_있다() {
        // given
        createFilterTestData();
        List<String> statuses = List.of("recruiting");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.getDiscussionsPage(
                null, DiscussionStatus.fromValues(statuses), new DiscussionCursorPageRequest(null, 10)
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(3),
                () -> assertThat(result.content()).allMatch(discussion -> {
                    Discussion entity = discussionRepository.findById(discussion.id()).orElseThrow();
                    return entity.getDiscussionStatus() == DiscussionStatus.RECRUITING;
                })
        );
    }

    @Test
    void 카테고리와_토론_상태_필터를_동시에_적용하여_토론_게시글을_조회할_수_있다() {
        // given
        createFilterTestData();
        List<String> categories = List.of("backend");
        List<String> statuses = List.of("recruiting");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.getDiscussionsPage(
                Category.fromValues(categories),
                DiscussionStatus.fromValues(statuses),
                new DiscussionCursorPageRequest(null, 10)
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(1),
                () -> assertThat(result.content().getFirst().category()).isEqualTo(Category.BACKEND),
                () -> {
                    Discussion entity = discussionRepository.findById(result.content().getFirst().id()).orElseThrow();
                    assertThat(entity.getDiscussionStatus()).isEqualTo(DiscussionStatus.RECRUITING);
                }
        );
    }

    @Test
    void 제목_또는_본문_검색_시_카테고리_필터를_적용할_수_있다() {
        // given
        createFilterTestData();
        List<String> categories = List.of("backend", "frontend");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "테스트", Category.fromValues(categories), null, null, 10
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(4),
                () -> assertThat(result.content()).allMatch(discussion ->
                        discussion.category().equals(Category.BACKEND) ||
                                discussion.category().equals(Category.FRONTEND))
        );
    }

    @Test
    void 제목_또는_본문_검색_시_토론_상태_필터를_적용할_수_있다() {
        // given
        createFilterTestData();
        List<String> statuses = List.of("recruiting");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "테스트", null, DiscussionStatus.fromValues(statuses), null, 10
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(3),
                () -> assertThat(result.content()).allMatch(discussion -> {
                    Discussion entity = discussionRepository.findById(discussion.id()).orElseThrow();
                    return entity.getDiscussionStatus() == DiscussionStatus.RECRUITING;
                })
        );
    }

    @Test
    void 제목_또는_본문_검색_시_카테고리와_토론_상태_필터를_동시에_적용할_수_있다() {
        // given
        createFilterTestData();
        List<String> categories = List.of("backend");
        List<String> statuses = List.of("recruiting");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.searchDiscussionWithFilters(
                TITLE_OR_CONTENT, "테스트",
                Category.fromValues(categories),
                DiscussionStatus.fromValues(statuses),
                null, 10
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(1),
                () -> assertThat(result.content().getFirst().category()).isEqualTo(Category.BACKEND),
                () -> {
                    Discussion entity = discussionRepository.findById(result.content().getFirst().id()).orElseThrow();
                    assertThat(entity.getDiscussionStatus()).isEqualTo(DiscussionStatus.RECRUITING);
                }
        );
    }

    @Test
    void 작성자_닉네임_검색_시_카테고리_필터를_적용할_수_있다() {
        // given
        createFilterTestData();
        List<String> categories = List.of("android", "common");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test", Category.fromValues(categories), null, null, 10
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(2),
                () -> assertThat(result.content()).allMatch(discussion ->
                        discussion.category().equals(Category.ANDROID) ||
                                discussion.category().equals(Category.COMMON))
        );
    }

    @Test
    void 작성자_닉네임_검색_시_토론_상태_필터를_적용할_수_있다() {
        // given
        createFilterTestData();
        List<String> statuses = List.of("recruitComplete");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test", null, DiscussionStatus.fromValues(statuses), null, 10
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(1),
                () -> assertThat(result.content()).allMatch(discussion -> {
                    Discussion entity = discussionRepository.findById(discussion.id()).orElseThrow();
                    return entity.getDiscussionStatus() == DiscussionStatus.RECRUIT_COMPLETE;
                })
        );
    }

    @Test
    void 작성자_닉네임_검색_시_카테고리와_토론_상태_필터를_동시에_적용할_수_있다() {
        // given
        createFilterTestData();
        List<String> categories = List.of("common");
        List<String> statuses = List.of("recruitComplete");

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.searchDiscussionWithFilters(
                AUTHOR_NICKNAME, "test",
                Category.fromValues(categories),
                DiscussionStatus.fromValues(statuses),
                null, 10
        );

        // then
        assertAll(
                () -> assertThat(result.content()).hasSize(1),
                () -> assertThat(result.content().getFirst().category()).isEqualTo(Category.COMMON),
                () -> {
                    Discussion entity = discussionRepository.findById(result.content().getFirst().id()).orElseThrow();
                    assertThat(entity.getDiscussionStatus()).isEqualTo(DiscussionStatus.RECRUIT_COMPLETE);
                }
        );
    }

    @Test
    void 빈_필터_조건으로_모든_토론_게시글을_조회할_수_있다() {
        // given
        createFilterTestData();

        // when
        DiscussionCursorPageResponse<DiscussionPreviewResponse> result = discussionService.getDiscussionsPage(
                null, null, new DiscussionCursorPageRequest(null, 10)
        );

        // then
        assertThat(result.content()).hasSize(6);
    }

    private void createFilterTestData() {
        User user1 = userRepository.save(createUser());
        User user2 = userRepository.save(createUser2());

        // BACKEND + RECRUITING (참가자 수 < 최대 참가자 수, 시작 시간이 미래)
        discussionRepository.save(createDiscussionForFilter(
                user1, "테스트 백엔드 1", Category.BACKEND,
                LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(4), 1, 5
        ));

        // FRONTEND + RECRUITING
        discussionRepository.save(createDiscussionForFilter(
                user1, "테스트 프론트엔드 1", Category.FRONTEND,
                LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(4), 2, 5
        ));

        // ANDROID + RECRUITING
        discussionRepository.save(createDiscussionForFilter(
                user2, "테스트 안드로이드 1", Category.ANDROID,
                LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(4), 3, 5
        ));

        // COMMON + RECRUIT_COMPLETE (참가자 수 = 최대 참가자 수, 시작 시간이 미래)
        discussionRepository.save(createDiscussionForFilter(
                user2, "테스트 공통 1", Category.COMMON,
                LocalDateTime.now().plusHours(2), LocalDateTime.now().plusHours(4), 3, 3
        ));

        // FRONTEND + IN_DISCUSSION (현재 진행 중)
        discussionRepository.save(createDiscussionForFilter(
                user1, "테스트 프론트엔드 2", Category.FRONTEND,
                LocalDateTime.now().minusHours(1), LocalDateTime.now().plusHours(1), 2, 5
        ));

        // BACKEND + DISCUSSION_COMPLETE (종료된 토론)
        discussionRepository.save(createDiscussionForFilter(
                user2, "테스트 백엔드 2", Category.BACKEND,
                LocalDateTime.now().minusHours(3), LocalDateTime.now().minusHours(1), 4, 5
        ));
    }

    private Discussion createDiscussionForFilter(User author, String title, Category category,
                                                 LocalDateTime startAt, LocalDateTime endAt,
                                                 int participantCount, int maxParticipantCount) {
        return Discussion.withNoValidateOf(
                title,
                "test content",
                startAt,
                endAt,
                "test place",
                0,
                participantCount,
                maxParticipantCount,
                category,
                "test summary",
                author
        );
    }

    private void createDummyDiscussions(int totalCount) {
        User user1 = userRepository.save(createUser());
        User user2 = userRepository.save(createUser2());

        // 여러 토론 게시글 생성 (시간 간격을 두고)
        for (int i = 0; i < totalCount; i++) {
            DiscussionCreateRequest request = createDiscussionRequest(
                    "테스트 제목 " + (i + 1),
                    i % 2 == 0 ? "홀수" : "짝수",
                    LocalDateTime.now().plusHours(1),
                    LocalDateTime.now().plusHours(2),
                    "테스트 장소",
                    5,
                    Category.BACKEND,
                    "테스트 요약"
            );

            discussionService.createDiscussion(request, i % 2 == 0 ? user1.getId() : user2.getId());

            // 생성 시간에 차이를 두기 위해 약간의 지연 추가
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private DiscussionCreateRequest createDiscussionRequest(
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String place,
            int maxParticipantCount,
            Category category,
            String summary) {
        return new DiscussionCreateRequest(
                title,
                content,
                startAt,
                endAt,
                place,
                maxParticipantCount,
                category,
                summary
        );
    }

    private List<DiscussionCreateRequest> createDiscussionsRequestWithParameters(
            int amount,
            String titlePrefix,
            String content,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String place,
            int capacity,
            Category category,
            String summary
    ) {
        return IntStream.range(0, amount)
                .mapToObj(i -> new DiscussionCreateRequest(
                        titlePrefix + (i + 1),
                        content,
                        startTime,
                        endTime,
                        place,
                        capacity,
                        category,
                        summary
                ))
                .toList();
    }

    private User createUser() {
        return User.builder()
                .oauthId("oauthId 1")
                .nickname("test 1")
                .webPushNotification(true)
                .build();
    }

    private User createUser2() {
        return User.builder()
                .oauthId("oauthId 2")
                .nickname("test 2")
                .webPushNotification(true)
                .build();
    }

    private ProfileImage createProfileImage(User user) {
        return ProfileImage.builder()
                .basicImageUri("/test")
                .customImageUri("/test")
                .storedFileName("")
                .originalFileName("")
                .user(user)
                .build();
    }

    private DiscussionCreateResponse saveDiscussion(User savedUser) {
        List<DiscussionCreateRequest> request = createDiscussionsRequestWithParameters(
                1,
                "modified title",
                "test content",
                LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(15),
                LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(30),
                "test place",
                6,
                Category.BACKEND,
                "test summary");
        return discussionService.createDiscussion(request.getFirst(), savedUser.getId());
    }

    private Discussion createDiscussion(User author) {
        return Discussion.builder()
                .title("title")
                .content("content")
                .author(author)
                .startAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(15))
                .endAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(30))
                .category(Category.BACKEND)
                .summary("summary")
                .maxParticipantCount(4)
                .participantCount(1)
                .place("place")
                .viewCount(2)
                .build();
    }
}
