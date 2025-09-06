package com.dialog.server.dto.response;

import com.dialog.server.domain.Discussion;

public record DiscussionCreateResponse(
        Long discussionId
) {
    public static DiscussionCreateResponse from(Discussion discussion) {
        return new DiscussionCreateResponse(
                discussion.getId()
        );
    }
}
