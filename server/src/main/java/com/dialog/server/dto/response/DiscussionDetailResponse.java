package com.dialog.server.dto.response;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionParticipant;
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
        int viewCount,
        long likeCount,
        boolean isBookmarked,
        AuthorResponse author,
        List<ParticipantResponse> participants
) {
    public record AuthorResponse(
            Long id,
            String name,
            String profileImage
    ) {
    }

    public record ParticipantResponse(
            Long id,
            String name
    ) {
    }


    public static DiscussionDetailResponse of(Discussion discussion,
                                              long likeCount,
                                              List<DiscussionParticipant> participants) {
        return new DiscussionDetailResponse(
                discussion.getId(),
                discussion.getTitle(),
                discussion.getContent(),
                discussion.getStartAt(),
                discussion.getEndAt(),
                discussion.getPlace(),
                discussion.getCategory(),
                discussion.getParticipantCount(),
                discussion.getMaxParticipantCount(),
                discussion.getSummary(),
                discussion.getCreatedAt(),
                discussion.getModifiedAt(),
                discussion.getViewCount(),
                likeCount,
                false,
                toAuthorResponse(discussion),
                toParticipantResponse(participants)
        );
    }

    private static AuthorResponse toAuthorResponse(Discussion discussion) {
        return new AuthorResponse(
                discussion.getAuthor().getId(),
                discussion.getAuthor().getNickname(),
                ""
        );
    }

    private static List<ParticipantResponse> toParticipantResponse(List<DiscussionParticipant> participants) {
        return participants.stream().map(participant -> new ParticipantResponse(
                participant.getParticipant().getId(),
                participant.getParticipant().getNickname()
        )).toList();
    }
}
