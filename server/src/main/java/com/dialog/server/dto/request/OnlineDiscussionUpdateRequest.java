package com.dialog.server.dto.request;

import com.dialog.server.domain.Category;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record OnlineDiscussionUpdateRequest(
        @NotBlank
        @Size(min = 1, max = 50)
        String title,
        @NotBlank
        @Size(min = 1, max = 10000)
        String content,
        @JsonFormat(pattern = "yyyy-MM-dd")
        LocalDate endDate,
        @NotNull
        Category category
) {
}
