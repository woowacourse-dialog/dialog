package com.dialog.server.domain;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.PROPERTY,
        property = "type"
)
@JsonSubTypes({
        @JsonSubTypes.Type(
                value = DiscussionCommentRouteParams.class,
                name = "DISCUSSION_COMMENT"
        ),
        @JsonSubTypes.Type(
                value = CommentReplyRouteParams.class,
                name = "COMMENT_REPLY"
        ),
})
public interface RouteParams {}
