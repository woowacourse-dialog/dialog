package com.dialog.server.dto.response;

import com.dialog.server.domain.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record DiscussionDetailResponse(
        Long id,
        DiscussionType discussionType,
        CommonDiscussionInfo commonDiscussionInfo,
        OfflineDiscussionInfo offlineDiscussionInfo,
        OnlineDiscussionInfo onlineDiscussionInfo
) {

    public static DiscussionDetailResponse fromOfflineDiscussion(
            OfflineDiscussion offlineDiscussion,
            long likeCount,
            ProfileImage profileImage
    ) {

        CommonDiscussionInfo commonInfo = CommonDiscussionInfo.from(
                offlineDiscussion,
                profileImage,
                likeCount
        );

        return new DiscussionDetailResponse(
                offlineDiscussion.getId(),
                DiscussionType.OFFLINE,
                commonInfo,
                new OfflineDiscussionInfo(
                        offlineDiscussion.getStartAt(),
                        offlineDiscussion.getEndAt(),
                        offlineDiscussion.getPlace(),
                        offlineDiscussion.getParticipantCount(),
                        offlineDiscussion.getMaxParticipantCount(),
                        ParticipantResponse.toParticipantResponse(offlineDiscussion.getDiscussionParticipants())
                ),
                null
        );
    }

    public static DiscussionDetailResponse fromOnlineDiscussion(
            OnlineDiscussion onlineDiscussion,
            long likeCount,
            ProfileImage profileImage
    ) {

        CommonDiscussionInfo commonInfo = CommonDiscussionInfo.from(
                onlineDiscussion,
                profileImage,
                likeCount
        );

        return new DiscussionDetailResponse(
                onlineDiscussion.getId(),
                DiscussionType.ONLINE,
                commonInfo,
                null,
                new OnlineDiscussionInfo(onlineDiscussion.getEndDate())
        );
    }

    public record CommonDiscussionInfo(
            String title,
            String content,
            String summary,
            Category category,
            LocalDateTime createdAt,
            LocalDateTime modifiedAt,
            long likeCount,
            AuthorResponse author
    ) {
        private static CommonDiscussionInfo from(
                Discussion discussion,
                ProfileImage profileImage,
                long likeCount
        ) {
            return new CommonDiscussionInfo(
                    discussion.getTitle(),
                    discussion.getContent(),
                    discussion.getSummary(),
                    discussion.getCategory(),
                    discussion.getCreatedAt(),
                    discussion.getModifiedAt(),
                    likeCount,
                    AuthorResponse.toAuthorResponse(discussion, profileImage)
            );
        }
    }

    public record AuthorResponse(
            Long id,
            String name,
            ProfileImageResponse profileImage
    ) {
        private static AuthorResponse toAuthorResponse(Discussion discussion, ProfileImage profileImage) {
            return new AuthorResponse(
                    discussion.getAuthor().getId(),
                    discussion.getAuthor().getNickname(),
                    profileImage == null ? null : ProfileImageResponse.from(profileImage)
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

    public record OfflineDiscussionInfo(
            @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
            LocalDateTime startAt,
            @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
            LocalDateTime endAt,
            String place,
            int participantCount,
            int maxParticipantCount,
            List<ParticipantResponse> participants
    ) {
    }

    public record ParticipantResponse(
            Long id,
            String name
    ) {
        private static List<ParticipantResponse> toParticipantResponse(List<DiscussionParticipant> participants) {
            return participants.stream()
                    .map(participant -> new ParticipantResponse(
                            participant.getParticipant().getId(),
                            participant.getParticipant().getNickname()
                    ))
                    .toList();
        }
    }

    public record OnlineDiscussionInfo(
            @JsonFormat(pattern = "yyyy-MM-dd")
            LocalDate endDate
    ) {
    }
}
