package com.dialog.server.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnExpectedException(Exception ex) {
        log.error("예상치 못한 예외가 발생했습니다.", ex);
        return ResponseEntity.internalServerError()
                .body(new ApiErrorResponse("0000", "예기치 못한 에러가 발생하였습니다."));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValidException(
            MissingServletRequestParameterException exception
    ) {
        String defaultErrorMessage = exception.getMessage();

        return ResponseEntity.badRequest()
                .body(new ApiErrorResponse("0001", defaultErrorMessage));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException exception
    ) {
        String errorMessage = exception.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> fieldError.getField() + "은(는) " + fieldError.getDefaultMessage())
                .findFirst()
                .orElse("잘못된 요청입니다.");

        return ResponseEntity.badRequest()
                .body(new ApiErrorResponse("0002", errorMessage));
    }

    @ExceptionHandler(DialogException.class)
    public ResponseEntity<ApiErrorResponse> handleUnExpectedException(DialogException ex) {
        log.warn("경고: ", ex);
        return ResponseEntity.status(ex.getStatus()).body(ApiErrorResponse.from(ex));
    }
}
