package com.dialog.server.dto.response;

import com.dialog.server.domain.ProfileImage;

public record ProfileImageUpdateResponse(String customImageUri, String basicImageUri) {
    public static ProfileImageUpdateResponse from(ProfileImage profileImage) {
        return new ProfileImageUpdateResponse(profileImage.getCustomImageUri(), profileImage.getBasicImageUri());
    }
}
