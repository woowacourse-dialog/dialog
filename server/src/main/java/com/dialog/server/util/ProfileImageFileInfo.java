package com.dialog.server.util;

public record ProfileImageFileInfo(
        String originalFileName,
        String fileExtension,
        String storedFileName
) {
}
