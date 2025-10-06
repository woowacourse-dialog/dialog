package com.dialog.server.dto.response;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionParticipant;
import com.dialog.server.domain.OfflineDiscussion;
import com.dialog.server.domain.ProfileImage;
import java.time.LocalDateTime;
import java.util.List;

public record DiscussionDetailResponse(
        Long id,
        String title,
        String content,
        LocalDateTime startAt,
        LocalDateTime endAt,
        String place,
        Category track,
        int participantCount,
        int maxParticipantCount,
        String summary,
        LocalDateTime createdAt,
        LocalDateTime modifiedAt,
        long likeCount,
        boolean isBookmarked,
        AuthorResponse author,
        List<ParticipantResponse> participants
) {
    public static DiscussionDetailResponse of(Discussion discussion,
                                              long likeCount,
                                              List<DiscussionParticipant> participants,
                                              ProfileImage profileImage) {
        if (discussion instanceof OfflineDiscussion offlineDiscussion) {
            return new DiscussionDetailResponse(
                    offlineDiscussion.getId(),
                    offlineDiscussion.getTitle(),
                    offlineDiscussion.getContent(),
                    offlineDiscussion.getStartAt(),
                    offlineDiscussion.getEndAt(),
                    offlineDiscussion.getPlace(),
                    offlineDiscussion.getCategory(),
                    offlineDiscussion.getParticipantCount(),
                    offlineDiscussion.getMaxParticipantCount(),
                    offlineDiscussion.getSummary(),
                    offlineDiscussion.getCreatedAt(),
                    offlineDiscussion.getModifiedAt(),
                    likeCount,
                    false,
                    toAuthorResponse(offlineDiscussion, profileImage),
                    toParticipantResponse(participants)
            );
        }
        throw new IllegalArgumentException("Unsupported discussion type");
    }

    private static AuthorResponse toAuthorResponse(Discussion discussion, ProfileImage profileImage) {
        return new AuthorResponse(
                discussion.getAuthor().getId(),
                discussion.getAuthor().getNickname(),
                profileImage == null ? null : ProfileImageResponse.from(profileImage)
        );
    }

    private static List<ParticipantResponse> toParticipantResponse(List<DiscussionParticipant> participants) {
        return participants.stream().map(participant -> new ParticipantResponse(
                participant.getParticipant().getId(),
                participant.getParticipant().getNickname()
        )).toList();
    }

    public record AuthorResponse(
            Long id,
            String name,
            ProfileImageResponse profileImage
    ) {
    }

    public record ParticipantResponse(
            Long id,
            String name
    ) {
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
