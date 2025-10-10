package com.dialog.server.dto.request;

import jakarta.validation.constraints.NotNull;

public record DiscussionSummaryCreateRequest(
        @NotNull Long discussionId
) {
}
