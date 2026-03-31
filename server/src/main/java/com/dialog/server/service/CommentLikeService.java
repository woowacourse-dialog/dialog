package com.dialog.server.service;

import com.dialog.server.domain.CommentLike;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.CommentLikeRepository;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentLikeService {

    private final CommentLikeRepository commentLikeRepository;
    private final UserRepository userRepository;
    private final DiscussionCommentRepository discussionCommentRepository;

    @Transactional
    public void create(Long userId, Long commentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        DiscussionComment comment = discussionCommentRepository.findById(commentId)
                .orElseThrow(() -> new DialogException(ErrorCode.COMMENT_NOT_FOUND));

        if (commentLikeRepository.existsByUserAndComment(user, comment)) {
            throw new DialogException(ErrorCode.ALREADY_COMMENT_LIKED);
        }

        CommentLike commentLike = CommentLike.builder()
                .user(user)
                .comment(comment)
                .build();
        commentLikeRepository.save(commentLike);
    }

    @Transactional
    public void delete(Long userId, Long commentId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
        DiscussionComment comment = discussionCommentRepository.findById(commentId)
                .orElseThrow(() -> new DialogException(ErrorCode.COMMENT_NOT_FOUND));

        if (!commentLikeRepository.existsByUserAndComment(user, comment)) {
            throw new DialogException(ErrorCode.NOT_COMMENT_LIKED_YET);
        }

        commentLikeRepository.deleteByUserAndComment(user, comment);
    }
}
