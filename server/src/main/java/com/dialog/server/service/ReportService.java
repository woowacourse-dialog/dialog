package com.dialog.server.service;

import com.dialog.server.domain.CommentReport;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.DiscussionReport;
import com.dialog.server.domain.ReportReason;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.CommentReportRepository;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.DiscussionReportRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final UserRepository userRepository;
    private final DiscussionRepository discussionRepository;
    private final DiscussionCommentRepository discussionCommentRepository;
    private final DiscussionReportRepository discussionReportRepository;
    private final CommentReportRepository commentReportRepository;

    @Transactional
    public void reportDiscussion(Long userId, Long discussionId, ReportReason reason) {
        User reporter = getUserById(userId);
        Discussion discussion = getDiscussionById(discussionId);

        if (!discussion.isNotAuthor(userId)) {
            throw new DialogException(ErrorCode.CANNOT_REPORT_OWN_CONTENT);
        }
        if (discussionReportRepository.existsByReporterAndDiscussion(reporter, discussion)) {
            throw new DialogException(ErrorCode.ALREADY_REPORTED);
        }

        discussionReportRepository.save(
                DiscussionReport.builder()
                        .reporter(reporter)
                        .discussion(discussion)
                        .reason(reason)
                        .build()
        );
    }

    @Transactional
    public void reportComment(Long userId, Long commentId, ReportReason reason) {
        User reporter = getUserById(userId);
        DiscussionComment comment = getCommentById(commentId);

        if (!comment.isNotAuthor(userId)) {
            throw new DialogException(ErrorCode.CANNOT_REPORT_OWN_CONTENT);
        }
        if (commentReportRepository.existsByReporterAndComment(reporter, comment)) {
            throw new DialogException(ErrorCode.ALREADY_REPORTED);
        }

        commentReportRepository.save(
                CommentReport.builder()
                        .reporter(reporter)
                        .comment(comment)
                        .reason(reason)
                        .build()
        );
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(userId + "에 해당하는 user를 찾을 수 없습니다."));
    }

    private Discussion getDiscussionById(Long discussionId) {
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
    }

    private DiscussionComment getCommentById(Long commentId) {
        return discussionCommentRepository.findById(commentId)
                .orElseThrow(() -> new DialogException(ErrorCode.COMMENT_NOT_FOUND));
    }
}
