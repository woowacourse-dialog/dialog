package com.dialog.server.dto.auth.request;

import com.dialog.server.domain.Track;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SignupRequest(
        @NotBlank String nickname,
        @NotNull Track track,
        boolean webPushNotification
) {
}
