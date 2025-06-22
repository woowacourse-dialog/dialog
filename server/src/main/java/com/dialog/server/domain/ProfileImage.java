package com.dialog.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "profile_image")
@Entity
public class ProfileImage extends BaseEntity {

    @Column(name = "profile_image_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    private String originalFileName;
    private String storedFileName;
    private String filePath;
    @Column(nullable = false)
    private String accessUrl;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    private ProfileImage(
            String filePath,
            String originalFileName,
            String storedFileName,
            String accessUrl,
            User user
    ) {
        this.filePath = filePath;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.accessUrl = accessUrl;
        this.user = user;
    }

    public void updateProfileImage(
            String filePath,
            String originalFileName,
            String storedFileName,
            String accessUrl
    ) {
        this.filePath = filePath;
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.accessUrl = accessUrl;
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
