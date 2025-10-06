package com.dialog.server.dto.request;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.OnlineDiscussion;
import com.dialog.server.domain.User;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record OnlineDiscussionCreateRequest(
        @NotBlank
        String title,
        @NotBlank
        String content,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        @NotNull
        Category category
) {
    public OnlineDiscussion toOnlineDiscussion(User author) {
        return OnlineDiscussion.builder()
                .title(title)
                .content(content)
                .endDate(endDate)
                .category(category)
                .author(author)
                .build();
    }
}
