package com.dialog.server.domain;

public record DiscussionCommentRouteParams(
        Long discussionId,
        Long discussionCommentId
) implements RouteParams {}
