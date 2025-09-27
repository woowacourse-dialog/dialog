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
            LocalDateTime modifiedAt
    ) {
        public static DiscussionCommentResponse withChildren(
                DiscussionComment parentComment,
                List<DiscussionComment> childComments,
                Map<User, ProfileImage> profileImagesByUserId) {

            List<DiscussionCommentResponse> childResponses = childComments.stream()
                    .map(childComment -> DiscussionCommentResponse.from(
                            childComment,
                            profileImagesByUserId.get(childComment.getAuthor())
                    ))
                    .toList();

            return DiscussionCommentResponse.from(
                    parentComment,
                    profileImagesByUserId.get(parentComment.getAuthor()),
                    childResponses
            );
        }

        private static DiscussionCommentResponse from(DiscussionComment comment, ProfileImage profileImage) {
            return from(comment, profileImage, List.of());
        }

        private static DiscussionCommentResponse from(DiscussionComment comment, ProfileImage profileImage, List<DiscussionCommentResponse> childComments) {
            return new DiscussionCommentResponse(
                    comment.getId(),
                    comment.getContent(),
                    AuthorResponse.from(comment.getAuthor(), profileImage),
                    childComments,
                    comment.getCreatedAt(),
                    comment.getModifiedAt()
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
