package com.dialog.server.dto.response;

import java.util.List;

public record ScrapCursorPageResponse<T>(
        List<T> content,
        Long nextCursorId,
        boolean hasNext,
        int size
) {
}
