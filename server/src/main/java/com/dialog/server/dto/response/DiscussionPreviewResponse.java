package com.dialog.server.dto.response;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.ProfileImage;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record DiscussionPreviewResponse(
        Long id,
        String title,
        String author,
        ProfileImageResponse profileImage,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime startAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime endAt,
        String place,
        Category category,
        int participantCount,
        int maxParticipantCount,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        int viewCount
) {

    public static DiscussionPreviewResponse from(Discussion discussion, ProfileImage profileImage) {
        return new DiscussionPreviewResponse(
                discussion.getId(),
                discussion.getTitle(),
                discussion.getAuthor().getNickname(),
                profileImage == null ? null : ProfileImageResponse.from(profileImage),
                discussion.getStartAt(),
                discussion.getEndAt(),
                discussion.getPlace(),
                discussion.getCategory(),
                discussion.getParticipantCount(),
                discussion.getMaxParticipantCount(),
                discussion.getCreatedAt(),
                discussion.getModifiedAt(),
                discussion.getViewCount()
        );
    }

    public record ProfileImageResponse(
            String basicImageUri,
            String customImageUri
    ) {
        private static ProfileImageResponse from(ProfileImage profileImage) {
            return new ProfileImageResponse(
                    profileImage.getBasicImageUri(),
                    profileImage.getCustomImageUri()
            );
        }
    }
}
