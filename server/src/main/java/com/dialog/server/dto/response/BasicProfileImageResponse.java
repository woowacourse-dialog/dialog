package com.dialog.server.dto.response;

import com.dialog.server.domain.ProfileImage;

public record BasicProfileImageResponse(String customImageUri, String basicImageUri) {
    public static BasicProfileImageResponse from(ProfileImage profileImage) {
        return new BasicProfileImageResponse(profileImage.getCustomImageUri(), profileImage.getBasicImageUri());
    }
}
