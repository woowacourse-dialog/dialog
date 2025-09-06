package com.dialog.server.dto.request;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public record DiscussionUpdateRequest(
        @NotBlank
        @Size(min = 1, max = 50)
        String title,
        @NotBlank
        @Size(min = 1, max = 10000)
        String content,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime startAt,
        @JsonFormat(pattern = "yyyy-MM-dd HH:mm")
        LocalDateTime endAt,
        @NotBlank
        @Size(min = 1, max = 50)
        String place,
        @NotNull
        Integer maxParticipantCount,
        @NotNull
        Category category,
        String summary
) {
    public Discussion toUpdateDiscussion() {
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
                .build();
    }
}
