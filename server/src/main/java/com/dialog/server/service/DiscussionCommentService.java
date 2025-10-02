package com.dialog.server.service;

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
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiscussionCommentService {

    private final DiscussionCommentRepository discussionCommentRepository;
    private final DiscussionRepository discussionRepository;
    private final UserRepository userRepository;
    private final ProfileImageRepository profileImageRepository;

    @Transactional
    public DiscussionCommentCreateResponse createComment(DiscussionCommentCreateRequest request, Long authorId) {
        Discussion discussion = discussionRepository.findById(request.discussionId())
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));

        DiscussionComment parentComment = null;
        if (request.parentDiscussionCommentId() != null) {
            parentComment = discussionCommentRepository.findById(request.parentDiscussionCommentId())
                    .orElseThrow(() -> new DialogException(ErrorCode.COMMENT_NOT_FOUND));

            if (parentComment.hasParent()) {
                throw new DialogException(ErrorCode.REPLY_DEPTH_EXCEEDED);
            }
        }

        DiscussionComment comment = DiscussionComment.builder()
                .content(request.content())
                .discussion(discussion)
                .author(author)
                .parentDiscussionComment(parentComment)
                .build();

        DiscussionComment savedComment = discussionCommentRepository.save(comment);

        return new DiscussionCommentCreateResponse(savedComment.getId());
    }

    @Transactional(readOnly = true)
    public DiscussionCommentListResponse getCommentsByDiscussionId(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));

        List<DiscussionComment> discussionComments = discussionCommentRepository.findByDiscussion(discussion);
        final List<DiscussionComment> parentComments = discussionComments.stream()
                .filter(discussionComment -> !discussionComment.hasParent())
                .toList();
        Map<Long, List<DiscussionComment>> childCommentsByParentId = groupChildCommentsByParentId(discussionComments);

        final Map<User, ProfileImage> authorProfileImages = getAuthorProfileImages(discussionComments);

        List<DiscussionCommentResponse> parentCommentResponses = parentComments.stream()
                .map(parentComment -> DiscussionCommentResponse.withChildren(
                        parentComment,
                        childCommentsByParentId.getOrDefault(parentComment.getId(), List.of()),
                        authorProfileImages
                ))
                .toList();
        return new DiscussionCommentListResponse(parentCommentResponses);
    }

    private Map<Long, List<DiscussionComment>> groupChildCommentsByParentId(List<DiscussionComment> allComments) {
        return allComments.stream()
                .filter(DiscussionComment::hasParent)
                .collect(Collectors.groupingBy(
                        comment -> comment.getParentDiscussionComment().getId()
                ));
    }

    private Map<User, ProfileImage> getAuthorProfileImages(List<DiscussionComment> discussionComments) {
        List<User> discussionAuthors = discussionComments.stream().map(DiscussionComment::getAuthor).toList();
        List<ProfileImage> discussionCommentAuthorProfileImages = profileImageRepository.findAllByUserIn(discussionAuthors);
        return discussionCommentAuthorProfileImages.stream()
                .collect(Collectors.toMap(ProfileImage::getUser, Function.identity()));
    }

    @Transactional
    public void updateComment(Long commentId, Long authorId, String content) {
        DiscussionComment comment = discussionCommentRepository.findById(commentId)
                .orElseThrow(() -> new DialogException(ErrorCode.COMMENT_NOT_FOUND));

        if (comment.isNotAuthor(authorId)) {
            throw new DialogException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        comment.updateContent(content);
    }

    @Transactional
    public void deleteComment(Long commentId, Long authorId) {
        DiscussionComment comment = discussionCommentRepository.findById(commentId)
                .orElseThrow(() -> new DialogException(ErrorCode.COMMENT_NOT_FOUND));

        if (comment.isNotAuthor(authorId)) {
            throw new DialogException(ErrorCode.UNAUTHORIZED_ACCESS);
        }

        List<DiscussionComment> replies = discussionCommentRepository.findByParentDiscussionComment(comment);;

        discussionCommentRepository.deleteAll(replies);
        discussionCommentRepository.delete(comment);
    }
}
