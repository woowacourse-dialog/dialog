package com.dialog.server.domain;

import java.util.Arrays;
import java.util.List;

public enum Category {
    BACKEND("backend"),
    FRONTEND("frontend"),
    ANDROID("android"),
    COMMON("common"),
    ;

    public final String value;

    Category(String value) {
        this.value = value;
    }

    public static List<Category> fromValues(List<String> values) {
        if (values == null || values.isEmpty()) {
            return List.of();
        }

        return values.stream()
                .map(value -> Arrays.stream(Category.values())
                        .filter(category -> category.value.equals(value))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Invalid Category value: " + value))
                )
                .toList();
    }
}
