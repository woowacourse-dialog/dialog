package com.dialog.server.dto.response;

import com.dialog.server.domain.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record DiscussionPreviewResponse(
        Long id,
        DiscussionType discussionType,
        CommonDiscussionInfo commonDiscussionInfo,
        OfflineDiscussionInfo offlineDiscussionInfo,
        OnlineDiscussionInfo onlineDiscussionInfo
) {

    public static DiscussionPreviewResponse fromOfflineDiscussion(OfflineDiscussion offlineDiscussion, ProfileImage profileImage, long commentCount) {
        CommonDiscussionInfo commonInfo = CommonDiscussionInfo.from(offlineDiscussion, profileImage, commentCount);

        return new DiscussionPreviewResponse(
                offlineDiscussion.getId(),
                DiscussionType.OFFLINE,
                commonInfo,
                new OfflineDiscussionInfo(
                        offlineDiscussion.getStartAt(),
                        offlineDiscussion.getEndAt(),
                        offlineDiscussion.getPlace(),
                        offlineDiscussion.getParticipantCount(),
                        offlineDiscussion.getMaxParticipantCount()
                ),
                null
        );
    }

    public static DiscussionPreviewResponse fromOnlineDiscussion(OnlineDiscussion onlineDiscussion, ProfileImage profileImage, long commentCount) {
        CommonDiscussionInfo commonInfo = CommonDiscussionInfo.from(onlineDiscussion, profileImage, commentCount);

        return new DiscussionPreviewResponse(
                onlineDiscussion.getId(),
                DiscussionType.ONLINE,
                commonInfo,
                null,
                new OnlineDiscussionInfo(onlineDiscussion.getEndDate())
        );
    }

    public record CommonDiscussionInfo(
            String title,
            String author,
            ProfileImageResponse profileImage,
            Category category,
            LocalDateTime createdAt,
            LocalDateTime modifiedAt,
            long commentCount
    ) {

        private static CommonDiscussionInfo from(Discussion discussion, ProfileImage profileImage, long commentCount) {
            return new CommonDiscussionInfo(
                    discussion.getTitle(),
                    discussion.getAuthor().getNickname(),
                    profileImage == null ? null : ProfileImageResponse.from(profileImage),
                    discussion.getCategory(),
                    discussion.getCreatedAt(),
                    discussion.getModifiedAt(),
                    commentCount
            );
        }
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

    private record OfflineDiscussionInfo(
            @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
            LocalDateTime startAt,
            @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
            LocalDateTime endAt,
            String place,
            int participantCount,
            int maxParticipantCount
    ) {
    }

    private record OnlineDiscussionInfo(
            @JsonFormat(pattern = "yyyy-MM-dd")
            LocalDate endDate
    ) {
    }
}
