package com.dialog.server.domain;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_oauth_social", columnNames = {"oauth_id", "social_type"})
})
@Entity
public class User extends BaseEntity {

    @Column(name = "user_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    private String oauthId;

    @Getter(AccessLevel.NONE)
    private String nickname;

    private String githubId;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(255) DEFAULT 'GITHUB'")
    private SocialType socialType;

    @Enumerated(EnumType.STRING)
    private Track track;

    private boolean webPushNotification;

    @Enumerated(EnumType.STRING)
    private Role role;

    private LocalDateTime deletedAt;

    @Builder
    private User(String oauthId,
                 String nickname,
                 String githubId,
                 SocialType socialType,
                 Track track,
                 boolean webPushNotification,
                 Role role) {
        this.oauthId = oauthId;
        this.nickname = nickname;
        this.githubId = githubId;
        this.socialType = socialType != null ? socialType : SocialType.GITHUB;
        this.track = track;
        this.webPushNotification = webPushNotification;
        this.role = role;
    }

    public void register(Track track,
                         boolean webPushNotification,
                         Role role) {
        validateWithDrawUser();

        this.track = track;
        this.webPushNotification = webPushNotification;
        this.role = role;
    }

    public boolean isRegistered() {
        return role != null && !role.equals(Role.TEMP_USER);
    }

    public boolean isNotSameId(Long id) {
        return !this.id.equals(id);
    }

    public void updateNotificationSetting(boolean settingValue) {
        validateWithDrawUser();

        webPushNotification = settingValue;
    }

    public void updateUser(String nickname, Track track) {
        validateWithDrawUser();

        if (nickname.length() < 2 || nickname.length() > 15) {
            throw new DialogException(ErrorCode.INVALID_NICKNAME_LENGTH);
        }
        this.nickname = nickname;
        this.track = track;
    }

    public void withdraw() {
        deletedAt = LocalDateTime.now();
    }

    public String getNickname() {
        if (deletedAt != null) {
            return "탈퇴한 사용자";
        }
        return nickname;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof User that)) {
            return false;
        }
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    private void validateWithDrawUser() {
        if (deletedAt != null) {
            throw new DialogException(ErrorCode.WITHDRAW_USER);
        }
    }
}
