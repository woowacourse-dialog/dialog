package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.OfflineDiscussion;
import com.dialog.server.domain.ReportReason;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.CommentReportRepository;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.DiscussionReportRepository;
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
class ReportServiceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private DiscussionCommentRepository discussionCommentRepository;

    @Autowired
    private DiscussionReportRepository discussionReportRepository;

    @Autowired
    private CommentReportRepository commentReportRepository;

    private ReportService reportService;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(
                userRepository,
                discussionRepository,
                discussionCommentRepository,
                discussionReportRepository,
                commentReportRepository
        );
    }

    @Test
    void 사용자는_게시글을_신고할_수_있다() {
        //given
        User author = createUser();
        User reporter = createUser();
        Discussion discussion = createOfflineDiscussion(author);

        //when
        reportService.reportDiscussion(reporter.getId(), discussion.getId(), ReportReason.SPAM);

        //then
        assertThat(discussionReportRepository.findAll())
                .hasSize(1)
                .first()
                .satisfies(report -> {
                    assertThat(report.getReporter()).isEqualTo(reporter);
                    assertThat(report.getDiscussion()).isEqualTo(discussion);
                    assertThat(report.getReason()).isEqualTo(ReportReason.SPAM);
                });
    }

    @Test
    void 게시글을_신고할때_이미_신고한_게시글이면_예외가_발생한다() {
        //given
        User author = createUser();
        User reporter = createUser();
        Discussion discussion = createOfflineDiscussion(author);
        reportService.reportDiscussion(reporter.getId(), discussion.getId(), ReportReason.SPAM);

        //when
        //then
        assertThatThrownBy(
                () -> reportService.reportDiscussion(reporter.getId(), discussion.getId(), ReportReason.SPAM))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.ALREADY_REPORTED.message);
    }

    @Test
    void 게시글을_신고할때_본인_게시글이면_예외가_발생한다() {
        //given
        User author = createUser();
        Discussion discussion = createOfflineDiscussion(author);

        //when
        //then
        assertThatThrownBy(() -> reportService.reportDiscussion(author.getId(), discussion.getId(), ReportReason.SPAM))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.CANNOT_REPORT_OWN_CONTENT.message);
    }

    @Test
    void 사용자는_댓글을_신고할_수_있다() {
        //given
        User author = createUser();
        User reporter = createUser();
        Discussion discussion = createOfflineDiscussion(author);
        DiscussionComment comment = createComment(author, discussion);

        //when
        reportService.reportComment(reporter.getId(), comment.getId(), ReportReason.ABUSE);

        //then
        assertThat(commentReportRepository.findAll())
                .hasSize(1)
                .first()
                .satisfies(report -> {
                    assertThat(report.getReporter()).isEqualTo(reporter);
                    assertThat(report.getComment()).isEqualTo(comment);
                    assertThat(report.getReason()).isEqualTo(ReportReason.ABUSE);
                });
    }

    @Test
    void 댓글을_신고할때_이미_신고한_댓글이면_예외가_발생한다() {
        //given
        User author = createUser();
        User reporter = createUser();
        Discussion discussion = createOfflineDiscussion(author);
        DiscussionComment comment = createComment(author, discussion);
        reportService.reportComment(reporter.getId(), comment.getId(), ReportReason.ABUSE);

        //when
        //then
        assertThatThrownBy(() -> reportService.reportComment(reporter.getId(), comment.getId(), ReportReason.ABUSE))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.ALREADY_REPORTED.message);
    }

    @Test
    void 댓글을_신고할때_본인_댓글이면_예외가_발생한다() {
        //given
        User author = createUser();
        Discussion discussion = createOfflineDiscussion(author);
        DiscussionComment comment = createComment(author, discussion);

        //when
        //then
        assertThatThrownBy(() -> reportService.reportComment(author.getId(), comment.getId(), ReportReason.ABUSE))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.CANNOT_REPORT_OWN_CONTENT.message);
    }

    private User createUser() {
        User user = User.builder()
                .nickname("test")
                .webPushNotification(false)
                .build();
        return userRepository.save(user);
    }

    private OfflineDiscussion createOfflineDiscussion(User author) {
        Discussion discussion = OfflineDiscussion.builder()
                .author(author)
                .category(Category.ANDROID)
                .content("content")
                .startAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(15))
                .endAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(30))
                .title("title")
                .maxParticipantCount(3)
                .participantCount(3)
                .place("place")
                .summary("summary")
                .build();
        return (OfflineDiscussion) discussionRepository.save(discussion);
    }

    private DiscussionComment createComment(User author, Discussion discussion) {
        DiscussionComment comment = DiscussionComment.builder()
                .content("comment content")
                .discussion(discussion)
                .author(author)
                .build();
        return discussionCommentRepository.save(comment);
    }
}

