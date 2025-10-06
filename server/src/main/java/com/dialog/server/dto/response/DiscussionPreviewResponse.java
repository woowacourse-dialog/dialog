package com.dialog.server.dto.response;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.OfflineDiscussion;
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
        long commentCount
) {

    public static DiscussionPreviewResponse from(Discussion discussion, ProfileImage profileImage, long commentCount) {
        if (discussion instanceof OfflineDiscussion offlineDiscussion) {
            return new DiscussionPreviewResponse(
                    offlineDiscussion.getId(),
                    offlineDiscussion.getTitle(),
                    offlineDiscussion.getAuthor().getNickname(),
                    profileImage == null ? null : ProfileImageResponse.from(profileImage),
                    offlineDiscussion.getStartAt(),
                    offlineDiscussion.getEndAt(),
                    offlineDiscussion.getPlace(),
                    offlineDiscussion.getCategory(),
                    offlineDiscussion.getParticipantCount(),
                    offlineDiscussion.getMaxParticipantCount(),
                    offlineDiscussion.getCreatedAt(),
                    offlineDiscussion.getModifiedAt(),
                    commentCount
            );
        }
        throw new IllegalArgumentException("Unsupported discussion type");
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
