package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Category;
import com.dialog.server.domain.CommentLike;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.OfflineDiscussion;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.CommentLikeRepository;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

@Import(JpaConfig.class)
@ActiveProfiles("test")
@DataJpaTest
class CommentLikeServiceTest {

    @Autowired
    private CommentLikeRepository commentLikeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private DiscussionCommentRepository discussionCommentRepository;

    private CommentLikeService commentLikeService;

    @BeforeEach
    void setUp() {
        commentLikeService = new CommentLikeService(commentLikeRepository, userRepository, discussionCommentRepository);
    }

    @Test
    void 사용자는_댓글에_좋아요를_할_수_있다() {
        // given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        DiscussionComment comment = createComment(discussion, user);

        // when
        commentLikeService.create(user.getId(), comment.getId());

        // then
        assertThat(commentLikeRepository.existsByUserAndComment(user, comment)).isTrue();
    }

    @Test
    void 좋아요를_할때_이미_좋아요를_눌렀다면_예외가_발생한다() {
        // given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        DiscussionComment comment = createComment(discussion, user);
        createCommentLike(user, comment);

        // when & then
        assertThatThrownBy(() -> commentLikeService.create(user.getId(), comment.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.ALREADY_COMMENT_LIKED.message);
    }

    @Test
    void 존재하지_않는_사용자는_댓글에_좋아요를_할_수_없다() {
        // given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        DiscussionComment comment = createComment(discussion, user);

        // when & then
        assertThatThrownBy(() -> commentLikeService.create(999L, comment.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.USER_NOT_FOUND.message);
    }

    @Test
    void 존재하지_않는_댓글에_좋아요를_할_수_없다() {
        // given
        User user = createUser();

        // when & then
        assertThatThrownBy(() -> commentLikeService.create(user.getId(), 999L))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.COMMENT_NOT_FOUND.message);
    }

    @Test
    void 사용자는_댓글에_대해_좋아요를_취소할_수_있다() {
        // given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        DiscussionComment comment = createComment(discussion, user);
        createCommentLike(user, comment);

        // when
        commentLikeService.delete(user.getId(), comment.getId());

        // then
        assertThat(commentLikeRepository.existsByUserAndComment(user, comment)).isFalse();
    }

    @Test
    void 좋아요를_취소할때_좋아요를_누르지_않은_상태라면_예외가_발생한다() {
        // given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        DiscussionComment comment = createComment(discussion, user);

        // when & then
        assertThatThrownBy(() -> commentLikeService.delete(user.getId(), comment.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.NOT_COMMENT_LIKED_YET.message);
    }

    @Test
    void 존재하지_않는_사용자는_댓글_좋아요를_취소할_수_없다() {
        // given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        DiscussionComment comment = createComment(discussion, user);

        // when & then
        assertThatThrownBy(() -> commentLikeService.delete(999L, comment.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.USER_NOT_FOUND.message);
    }

    @Test
    void 존재하지_않는_댓글의_좋아요를_취소할_수_없다() {
        // given
        User user = createUser();

        // when & then
        assertThatThrownBy(() -> commentLikeService.delete(user.getId(), 999L))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.COMMENT_NOT_FOUND.message);
    }

    private User createUser() {
        User user = User.builder()
                .nickname("test")
                .webPushNotification(false)
                .build();
        return userRepository.save(user);
    }

    private Discussion createDiscussion(User author) {
        Discussion discussion = OfflineDiscussion.builder()
                .author(author)
                .category(Category.BACKEND)
                .content("content")
                .startAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)))
                .endAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(17, 0)))
                .title("title")
                .maxParticipantCount(3)
                .participantCount(1)
                .place("place")
                .summary("summary")
                .build();
        return discussionRepository.save(discussion);
    }

    private DiscussionComment createComment(Discussion discussion, User author) {
        DiscussionComment comment = DiscussionComment.builder()
                .content("테스트 댓글")
                .discussion(discussion)
                .author(author)
                .parentDiscussionComment(null)
                .build();
        return discussionCommentRepository.save(comment);
    }

    private CommentLike createCommentLike(User user, DiscussionComment comment) {
        CommentLike commentLike = CommentLike.builder()
                .user(user)
                .comment(comment)
                .build();
        return commentLikeRepository.save(commentLike);
    }
}
