package com.dialog.server.dto.request;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record DiscussionCreateRequest(
        @NotBlank
        String title,
        @NotBlank
        String content,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime startAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime endAt,
        @NotBlank
        String place,
        @NotNull
        Integer maxParticipantCount,
        @NotNull
        Category category,
        String summary
) {
    public Discussion toDiscussion(User author) {
        return Discussion.builder()
                .title(title)
                .content(content)
                .startAt(startAt)
                .endAt(endAt)
                .place(place)
                .category(category)
                .viewCount(0)
                .participantCount(1)
                .maxParticipantCount(maxParticipantCount)
                .summary(summary)
                .author(author)
                .build();
    }
}
