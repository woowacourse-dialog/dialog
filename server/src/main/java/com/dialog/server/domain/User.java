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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "users")
@Entity
public class User extends BaseEntity {

    @Column(name = "user_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    private String oauthId;

    private String nickname;

    private String githubId;

    @Enumerated(EnumType.STRING)
    private Track track;

    private boolean webPushNotification;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean isDeleted;

    @Builder
    private User(String oauthId,
                 String nickname,
                 String githubId,
                 Track track,
                 boolean webPushNotification,
                 Role role) {
        this.oauthId = oauthId;
        this.nickname = nickname;
        this.githubId = githubId;
        this.track = track;
        this.webPushNotification = webPushNotification;
        this.role = role;
    }

    public void register(Track track,
                         boolean webPushNotification,
                         Role role) {
        this.track = track;
        this.webPushNotification = webPushNotification;
        this.role = role;
    }

    public boolean isRegistered() {
        return !role.equals(Role.TEMP_USER);
    }

    public void updateNotificationSetting(boolean settingValue) {
        webPushNotification = settingValue;
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

    public void updateUser(String nickname, Track track) {
        if (nickname.length() < 2 || nickname.length() > 15) {
            throw new DialogException(ErrorCode.INVALID_NICKNAME_LENGTH);
        }
        this.nickname = nickname;
        this.track = track;
    }
}
