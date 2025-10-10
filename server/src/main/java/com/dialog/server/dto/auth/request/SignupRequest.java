package com.dialog.server.dto.auth.request;

import com.dialog.server.domain.Track;
import jakarta.validation.constraints.NotNull;

public record SignupRequest(
        @NotNull Track track,
        boolean webPushNotification
) {
}
