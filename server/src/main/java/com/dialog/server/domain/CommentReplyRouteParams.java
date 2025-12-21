package com.dialog.server.domain;

public record CommentReplyRouteParams(
        Long discussionId,
        Long commentId,
        Long replyId
) implements RouteParams{
}
