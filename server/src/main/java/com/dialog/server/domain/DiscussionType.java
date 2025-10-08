package com.dialog.server.domain;

import java.util.Arrays;
import java.util.List;

public enum DiscussionType {
    ONLINE("online"),
    OFFLINE("offline"),
    ;
    public final String value;

    DiscussionType(final String value) {
        this.value = value;
    }

    public static List<DiscussionType> fromValues(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .map(value -> Arrays.stream(DiscussionType.values())
                        .filter(discussionType -> discussionType.value.equals(value))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Invalid DiscussionType value: " + value))
                )
                .toList();
    }
}
