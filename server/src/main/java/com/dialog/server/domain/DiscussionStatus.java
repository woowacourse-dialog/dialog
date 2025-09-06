package com.dialog.server.domain;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public enum DiscussionStatus {
    RECRUITING("recruiting", "모집 중"),
    RECRUIT_COMPLETE("recruitComplete", "모집 완료"),
    IN_DISCUSSION("inDiscussion", "토론 중"),
    DISCUSSION_COMPLETE("discussionComplete", "토론 완료"),
    ;

    public final String value;
    public final String description;

    DiscussionStatus(String value, String description) {
        this.value = value;
        this.description = description;
    }

    public static List<DiscussionStatus> fromValues(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .map(value -> Arrays.stream(DiscussionStatus.values())
                        .filter(status -> status.value.equals(value))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Invalid DiscussionStatus value: " + value))
                )
                .toList();
    }

    public static DiscussionStatus decideDiscussionStatus(LocalDateTime startAt,
                                                          LocalDateTime endAt,
                                                          int participantCount,
                                                          int maxParticipantCount) {
        final LocalDateTime now = LocalDateTime.now();

        if (startAt.isAfter(now) && participantCount < maxParticipantCount) {
            return RECRUITING;
        }
        if (startAt.isAfter(now) && participantCount >= maxParticipantCount) {
            return RECRUIT_COMPLETE;
        }
        if ((startAt.equals(now) || startAt.isBefore(now))
                && (endAt.equals(now) || endAt.isAfter(now))) {
            return IN_DISCUSSION;
        }
        return DISCUSSION_COMPLETE;
    }
}
