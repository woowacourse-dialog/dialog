package com.dialog.server.domain;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.util.ProfileImageFileInfo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Objects;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "profile_image")
@Entity
public class ProfileImage extends BaseEntity {

    private static final List<String> AVAILABLE_EXTENSIONS = List.of("png", "jpg", "jpeg", "gif");

    @Column(name = "profile_image_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    private String originalFileName;
    private String storedFileName;
    private String customImageUri;
    @Column(nullable = false)
    private String basicImageUri;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    private ProfileImage(
            String originalFileName,
            String storedFileName,
            String customImageUri,
            String basicImageUri,
            User user
    ) {
        validBasicProfileUri(basicImageUri);
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.customImageUri = customImageUri;
        this.basicImageUri = basicImageUri;
        this.user = user;
    }

    public void updateProfileImage(
            ProfileImageFileInfo fileInfo,
            String updatedImageUri
    ) {
        validateAvailableExtension(fileInfo.fileExtension());
        this.originalFileName = fileInfo.originalFileName();
        this.storedFileName = fileInfo.storedFileName();
        this.customImageUri = updatedImageUri;
    }

    private void validBasicProfileUri(String basicProfileUri) {
        if (basicProfileUri == null || basicProfileUri.isBlank()) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    private void validateAvailableExtension(String extension) {
        if (!AVAILABLE_EXTENSIONS.contains(extension)) {
            throw new DialogException(ErrorCode.INVALID_IMAGE_FORMAT);
        }
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof ProfileImage that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }
}
