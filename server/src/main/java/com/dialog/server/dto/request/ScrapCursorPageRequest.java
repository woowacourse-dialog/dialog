package com.dialog.server.dto.request;

public record ScrapCursorPageRequest(
        Long lastCursorId,
        int pageSize
) {
}
