package com.dialog.server.dto.comment.response;

import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record DiscussionCommentListResponse(
        List<DiscussionCommentResponse> discussionComments
) {

    public record DiscussionCommentResponse(
            Long discussionCommentId,
            String content,
            AuthorResponse author,
            List<DiscussionCommentResponse> childComments,
            @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
            LocalDateTime createdAt,
            @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
            LocalDateTime modifiedAt,
            long likeCount,
            boolean isLiked
    ) {
        public static DiscussionCommentResponse withChildren(
                DiscussionComment parentComment,
                List<DiscussionComment> childComments,
                Map<User, ProfileImage> profileImagesByUserId,
                Map<Long, Long> likeCountByCommentId,
                java.util.Set<Long> likedCommentIds) {

            List<DiscussionCommentResponse> childResponses = childComments.stream()
                    .map(childComment -> DiscussionCommentResponse.from(
                            childComment,
                            profileImagesByUserId.get(childComment.getAuthor()),
                            likeCountByCommentId,
                            likedCommentIds
                    ))
                    .toList();

            return DiscussionCommentResponse.from(
                    parentComment,
                    profileImagesByUserId.get(parentComment.getAuthor()),
                    childResponses,
                    likeCountByCommentId,
                    likedCommentIds
            );
        }

        private static DiscussionCommentResponse from(DiscussionComment comment, ProfileImage profileImage,
                Map<Long, Long> likeCountByCommentId, java.util.Set<Long> likedCommentIds) {
            return from(comment, profileImage, List.of(), likeCountByCommentId, likedCommentIds);
        }

        private static DiscussionCommentResponse from(DiscussionComment comment, ProfileImage profileImage,
                List<DiscussionCommentResponse> childComments,
                Map<Long, Long> likeCountByCommentId, java.util.Set<Long> likedCommentIds) {
            return new DiscussionCommentResponse(
                    comment.getId(),
                    comment.getContent(),
                    AuthorResponse.from(comment.getAuthor(), profileImage),
                    childComments,
                    comment.getCreatedAt(),
                    comment.getModifiedAt(),
                    likeCountByCommentId.getOrDefault(comment.getId(), 0L),
                    likedCommentIds.contains(comment.getId())
            );
        }

        public record AuthorResponse(
                Long authorId,
                String nickname,
                ProfileImageResponse profileImage
        ) {
            public static AuthorResponse from(com.dialog.server.domain.User user, ProfileImage profileImage) {
                return new AuthorResponse(
                        user.getId(),
                        user.getNickname(),
                        profileImage != null ? ProfileImageResponse.from(profileImage) : null
                );
            }
        }

        public record ProfileImageResponse(
                String basicImageUri,
                String customImageUri
        ) {
            public static ProfileImageResponse from(ProfileImage profileImage) {
                return new ProfileImageResponse(
                        profileImage.getBasicImageUri(),
                        profileImage.getCustomImageUri()
                );
            }
        }
    }
}
