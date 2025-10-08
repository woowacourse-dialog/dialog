package com.dialog.server.domain;

import java.util.List;
import java.util.Map;

public record DiscussionWithComment(Discussion discussion,
                                    Map<DiscussionComment, List<DiscussionComment>> commentAndReply) {

    public boolean hasSummary() {
        return !discussion.hasNotSummary();
    }

    public String getSummary() {
        return discussion.getSummary();
    }
}
