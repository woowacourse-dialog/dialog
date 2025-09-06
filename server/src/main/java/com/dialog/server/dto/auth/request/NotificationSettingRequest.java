package com.dialog.server.dto.auth.request;

import jakarta.validation.constraints.NotNull;

public record NotificationSettingRequest(@NotNull boolean isNotificationEnable) {
}
