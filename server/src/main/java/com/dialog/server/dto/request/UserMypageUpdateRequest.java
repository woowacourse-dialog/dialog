package com.dialog.server.dto.request;

import com.dialog.server.domain.Track;
import jakarta.validation.constraints.NotBlank;

public record UserMypageUpdateRequest(
        @NotBlank String nickname,
        @NotBlank Track track
) {
}
