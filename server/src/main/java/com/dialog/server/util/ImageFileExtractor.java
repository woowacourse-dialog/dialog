package com.dialog.server.util;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Component
public class ImageFileExtractor {
    private static final String INVALID_PATH = "..";
    private static final String EXTENSION_SEPARATOR = ".";
    private static final String STORED_FILE_REGEX = "%s.%s";

    public ProfileImageFileInfo getInfo(MultipartFile imageFile) {
        validEmptyFile(imageFile);
        String originFilename = getOriginFileName(imageFile);
        String fileExtension = getFileExtension(originFilename);
        String storedFileName = getStoredFileName(fileExtension);
        return new ProfileImageFileInfo(originFilename, fileExtension, storedFileName);
    }

    private void validEmptyFile(MultipartFile imageFile) {
        if (imageFile.isEmpty()) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    private String getOriginFileName(MultipartFile imageFile) {
        String originFilename = imageFile.getOriginalFilename();
        if (originFilename == null || originFilename.contains(INVALID_PATH)) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
        return originFilename;
    }

    private String getFileExtension(String fileName) {
        int separatorIndex = fileName.lastIndexOf(EXTENSION_SEPARATOR);
        String fileExtension;
        if (separatorIndex == -1) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        } else {
            fileExtension = fileName.substring(separatorIndex + 1).toLowerCase();
        }
        return fileExtension;
    }

    private String getStoredFileName(String fileExtension) {
        UUID uuid = UUID.randomUUID();
        return String.format(STORED_FILE_REGEX, uuid, fileExtension);
    }
}
