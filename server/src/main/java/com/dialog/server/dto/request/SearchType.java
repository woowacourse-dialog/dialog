package com.dialog.server.dto.request;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;

public enum SearchType {
    TITLE_OR_CONTENT(0),
    AUTHOR_NICKNAME(1),
    ;

    public final int value;

    SearchType(int value) {
        this.value = value;
    }

    public static SearchType fromValue(int value) {
        for (SearchType type : values()) {
            if (type.value == value) {
                return type;
            }
        }
        throw new DialogException(ErrorCode.INVALID_SEARCH_TYPE);
    }
}
