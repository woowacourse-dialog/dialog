package com.dialog.server.exception;

public record ApiErrorResponse(String errorCode, String message) {

    public static ApiErrorResponse from(DialogException exception) {
        return new ApiErrorResponse(exception.getCode(), exception.getMessage());
    }
}
