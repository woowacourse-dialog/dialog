package com.dialog.server.dto.comment.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DiscussionCommentCreateRequest(
        @NotBlank
        String content,
        @NotNull
        Long discussionId,
        Long parentDiscussionCommentId
) {
}
