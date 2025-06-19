package com.dialog.server.dto.request;

public record DiscussionCursorPageRequest(
        String cursor,
        int size
) {
}
