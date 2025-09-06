package com.dialog.server.dto.response;

import java.util.List;

public record DiscussionCursorPageResponse<T>(
        List<T> content,
        String nextCursor,
        boolean hasNext,
        int size
) {
}
