package com.dialog.server.dto.auth.request;

import jakarta.validation.constraints.NotBlank;

public record AppleLoginRequest(
    @NotBlank String identityToken,
    String firstName,
    String lastName
) {}
