package com.dialog.server.dto.response;

import com.dialog.server.domain.Discussion;

public record DiscussionSummaryCreateResponse(
        Long discussionId,
        String summary
) {
    public static DiscussionSummaryCreateResponse of(Discussion discussion) {
        return new DiscussionSummaryCreateResponse(discussion.getId(), discussion.getSummary());
    }
}
