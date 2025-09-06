package com.dialog.server.exception;

import org.springframework.http.HttpStatus;

public class DialogException extends RuntimeException {

    private final ErrorCode errorCode;

    public DialogException(ErrorCode errorCode) {
        super(errorCode.message);
        this.errorCode = errorCode;
    }

    public DialogException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.message, cause);
        this.errorCode = errorCode;
    }

    public String getCode() {
        return errorCode.code;
    }

    public HttpStatus getStatus() {
        return errorCode.status;
    }
}
