package com.dialog.server.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UserNicknameUpdateRequest(
        @NotBlank String nickname
) {
}
