package com.dialog.server.domain;

public record CommentReplyRouteParams(
        Long commentId,
        Long replyId
) implements RouteParams{
}
