package com.dialog.server.dto.comment.request;

import jakarta.validation.constraints.NotBlank;

public record DiscussionCommentUpdateRequest(
        @NotBlank
        String content
) {
}
