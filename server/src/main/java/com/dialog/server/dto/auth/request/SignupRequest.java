package com.dialog.server.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

public record SignupRequest(
        @NotBlank String nickname,
        boolean webPushNotification
) {
}
