package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertAll;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.User;
import com.dialog.server.dto.comment.request.DiscussionCommentCreateRequest;
import com.dialog.server.dto.comment.response.DiscussionCommentCreateResponse;
import com.dialog.server.dto.comment.response.DiscussionCommentListResponse;
import com.dialog.server.dto.comment.response.DiscussionCommentListResponse.DiscussionCommentResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
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
class DiscussionCommentServiceTest {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private DiscussionRepository discussionRepository;
    @Autowired
    private DiscussionCommentRepository discussionCommentRepository;
    @Autowired
    private DiscussionCommentService discussionCommentService;
    @Autowired
    private ProfileImageRepository profileImageRepository;

    private User author1;
    private User author2;
    private Discussion discussion;
    private DiscussionComment comment;

    @BeforeEach
    void setUp() {
        author1 = userRepository.save(createUser());
        author2 = userRepository.save(createUser2());
        discussion = discussionRepository.save(createDiscussion(author1));
        profileImageRepository.save(createProfileImage(author1));
        profileImageRepository.save(createProfileImage2(author2));
        comment = discussionCommentRepository.save(createComment(discussion, author1));
    }


    @Test
    void 댓글을_생성할_수_있다() {
        // given
        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "테스트 댓글 내용",
                discussion.getId(),
                null
        );

        // when
        DiscussionCommentCreateResponse response = discussionCommentService.createComment(request, author1.getId());

        // then
        assertThat(discussionCommentRepository.findById(response.id())).isPresent();
    }

    @Test
    void 답글을_생성할_수_있다() {
        // given
        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "테스트 답글 내용",
                discussion.getId(),
                comment.getId()
        );

        // when
        DiscussionCommentCreateResponse response = discussionCommentService.createComment(request, author2.getId());

        // then
        DiscussionComment savedReply = discussionCommentRepository.findById(response.id()).orElseThrow();

        assertThat(savedReply.getParentDiscussionComment()).isNotNull();
        assertAll(
                () -> assertThat(savedReply.getParentDiscussionComment().getId()).isEqualTo(comment.getId()),
                () -> assertThat(savedReply.hasParent()).isTrue()
        );
    }

    @Test
    void 답글에_대한_답글은_생성할_수_없다() {
        // given
        DiscussionComment childComment = discussionCommentRepository.save(createReplyComment(discussion, author2, comment));

        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "3depth 댓글",
                discussion.getId(),
                childComment.getId()
        );

        // when & then
        assertThatThrownBy(() -> discussionCommentService.createComment(request, author1.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.REPLY_DEPTH_EXCEEDED.message);
    }

    @Test
    void 존재하지_않는_토론글에_댓글을_생성할_수_없다() {
        // given
        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "테스트 댓글 내용",
                999L,
                null
        );

        // when & then
        assertThatThrownBy(() -> discussionCommentService.createComment(request, author1.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.NOT_FOUND_DISCUSSION.message);
    }

    @Test
    void 존재하지_않는_부모댓글에_답글을_생성할_수_없다() {
        // given
        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "테스트 답글 내용",
                discussion.getId(),
                999L
        );

        // when & then
        assertThatThrownBy(() -> discussionCommentService.createComment(request, author1.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.COMMENT_NOT_FOUND.message);
    }

    @Test
    void 존재하지_않는_사용자는_댓글을_생성할_수_없다() {
        // given
        DiscussionCommentCreateRequest request = new DiscussionCommentCreateRequest(
                "테스트 댓글 내용",
                discussion.getId(),
                null
        );

        // when & then
        assertThatThrownBy(() -> discussionCommentService.createComment(request, 999L))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.USER_NOT_FOUND.message);
    }

    @Test
    void 토론글의_댓글_목록을_조회할_수_있다() {
        // given
        Discussion discussion = discussionRepository.save(createDiscussion(author1));

        // 부모댓글 2개 생성
        DiscussionComment parentComment1 = discussionCommentRepository.save(createComment(discussion, author1, "첫 번째 부모댓글"));
        DiscussionComment parentComment2 = discussionCommentRepository.save(createComment(discussion, author2, "두 번째 부모댓글"));

        // 첫 번째 부모댓글에 답글 2개
        discussionCommentRepository.save(createReplyComment(discussion, author2, parentComment1, "첫 번째 답글"));
        discussionCommentRepository.save(createReplyComment(discussion, author1, parentComment1, "두 번째 답글"));

        // 두 번째 부모댓글에 답글 1개
        discussionCommentRepository.save(createReplyComment(discussion, author2, parentComment2, "세 번째 답글"));

        // when
        DiscussionCommentListResponse response = discussionCommentService.getCommentsByDiscussionId(discussion.getId());

        // then
        DiscussionCommentResponse firstParent = response.discussionComments().get(0);
        DiscussionCommentResponse secondParent = response.discussionComments().get(1);

        assertAll(
                () -> assertThat(response.discussionComments()).hasSize(2),
                () -> assertThat(firstParent.content()).isEqualTo("첫 번째 부모댓글"),
                () -> assertThat(firstParent.childComments()).hasSize(2),
                () -> assertThat(secondParent.content()).isEqualTo("두 번째 부모댓글"),
                () -> assertThat(secondParent.childComments()).hasSize(1)
        );
    }

    @Test
    void 댓글이_없는_토론글의_댓글_목록을_조회할_수_있다() {
        // given
        Discussion discussion = discussionRepository.save(createDiscussion(author1));

        // when
        DiscussionCommentListResponse response = discussionCommentService.getCommentsByDiscussionId(discussion.getId());

        // then
        assertThat(response.discussionComments()).isEmpty();
    }

    @Test
    void 존재하지_않는_토론글의_댓글_목록을_조회할_수_없다() {
        // when & then
        assertThatThrownBy(() -> discussionCommentService.getCommentsByDiscussionId(999L))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.NOT_FOUND_DISCUSSION.message);
    }

    @Test
    void 댓글을_수정할_수_있다() {
        // given
        DiscussionComment comment = discussionCommentRepository.save(createComment(discussion, author1));
        String updatedContent = "수정된 댓글 내용";

        // when
        discussionCommentService.updateComment(comment.getId(), author1.getId(), updatedContent);

        // then
        DiscussionComment updatedComment = discussionCommentRepository.findById(comment.getId()).orElseThrow();
        assertThat(updatedComment.getContent()).isEqualTo(updatedContent);
    }

    @Test
    void 다른_사용자의_댓글을_수정할_수_없다() {
        // given
        Discussion discussion = discussionRepository.save(createDiscussion(author1));
        DiscussionComment comment = discussionCommentRepository.save(createComment(discussion, author1));

        // when & then
        assertThatThrownBy(() -> discussionCommentService.updateComment(comment.getId(), author2.getId(), "수정 시도"))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.UNAUTHORIZED_ACCESS.message);
    }

    @Test
    void 존재하지_않는_댓글을_수정할_수_없다() {
        // when & then
        assertThatThrownBy(() -> discussionCommentService.updateComment(999L, author1.getId(), "수정 시도"))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.COMMENT_NOT_FOUND.message);
    }

    @Test
    void 댓글을_삭제할_수_있다() {
        // given
        DiscussionComment comment = discussionCommentRepository.save(createComment(discussion, author1));

        // when
        discussionCommentService.deleteComment(comment.getId(), author1.getId());

        // then
        assertThat(discussionCommentRepository.findById(comment.getId())).isEmpty();
    }

    @Test
    void 부모댓글_삭제_시_답글도_함께_삭제된다() {
        // given
        DiscussionComment childComment1 = discussionCommentRepository.save(createReplyComment(discussion, author1, comment));
        DiscussionComment childComment2 = discussionCommentRepository.save(createReplyComment(discussion, author1, comment));

        // when
        discussionCommentService.deleteComment(comment.getId(), author1.getId());

        // then
        assertAll(
                () -> assertThat(discussionCommentRepository.findById(comment.getId())).isEmpty(),
                () -> assertThat(discussionCommentRepository.findById(childComment1.getId())).isEmpty(),
                () -> assertThat(discussionCommentRepository.findById(childComment2.getId())).isEmpty()
        );
    }

    @Test
    void 다른_사용자의_댓글을_삭제할_수_없다() {
        // given
        DiscussionComment comment = discussionCommentRepository.save(createComment(discussion, author1));

        // when & then
        assertThatThrownBy(() -> discussionCommentService.deleteComment(comment.getId(), author2.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.UNAUTHORIZED_ACCESS.message);
    }

    @Test
    void 존재하지_않는_댓글을_삭제할_수_없다() {
        // when & then
        assertThatThrownBy(() -> discussionCommentService.deleteComment(999L, author1.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessageContaining(ErrorCode.COMMENT_NOT_FOUND.message);
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

    private Discussion createDiscussion(User author) {
        return Discussion.builder()
                .title("테스트 토론")
                .content("테스트 내용")
                .author(author)
                .startAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)))
                .endAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(17, 0)))
                .category(Category.BACKEND)
                .summary("테스트 요약")
                .maxParticipantCount(5)
                .participantCount(1)
                .place("테스트 장소")
                .viewCount(0)
                .build();
    }

    private DiscussionComment createComment(Discussion discussion, User author) {
        return createComment(discussion, author, "테스트 댓글 내용");
    }

    private DiscussionComment createComment(Discussion discussion, User author, String content) {
        return DiscussionComment.builder()
                .content(content)
                .discussion(discussion)
                .author(author)
                .parentDiscussionComment(null)
                .build();
    }

    private DiscussionComment createReplyComment(Discussion discussion, User author, DiscussionComment parentComment) {
        return createReplyComment(discussion, author, parentComment, "테스트 답글 내용");
    }

    private DiscussionComment createReplyComment(Discussion discussion, User author, DiscussionComment parentComment, String content) {
        return DiscussionComment.builder()
                .content(content)
                .discussion(discussion)
                .author(author)
                .parentDiscussionComment(parentComment)
                .build();
    }

    private ProfileImage createProfileImage(User user) {
        return ProfileImage.builder()
                .basicImageUri("/test1")
                .customImageUri("/test1")
                .storedFileName("")
                .originalFileName("")
                .user(user)
                .build();
    }

    private ProfileImage createProfileImage2(User user) {
        return ProfileImage.builder()
                .basicImageUri("/test2")
                .customImageUri("/test2")
                .storedFileName("")
                .originalFileName("")
                .user(user)
                .build();
    }
}
