package com.dialog.server.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class S3Uploader {
    private static final String PROFILE_IMAGE_DIR_NAME = "profile-images";
    private static final String PATH_SEPARATOR = "/";
    private static final String S3_AWS_URI_REGEX = "https://%s.s3.amazonaws.com/%s";

    private final S3Client s3Client;
    @Value("${aws.s3.bucket}")
    private String bucketName;

    public String uploadProfileImage(MultipartFile file, String storedFileName) throws IOException {
        String filePath = PROFILE_IMAGE_DIR_NAME + PATH_SEPARATOR + storedFileName;
        String contentType = file.getContentType();
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(filePath)
                .contentType(contentType)
                .build();
        s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        return getFileUrl(filePath);
    }

    private String getFileUrl(String fileName) {
        return String.format(S3_AWS_URI_REGEX, bucketName, fileName);
    }
}
