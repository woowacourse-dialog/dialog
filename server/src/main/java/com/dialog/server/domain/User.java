package com.dialog.server.domain;

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

    @Enumerated(EnumType.STRING)
    private Track track;

    private boolean webPushNotification;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean isDeleted;

    @Builder
    private User(String oauthId,
                 String nickname,
                 Track track,
                 boolean webPushNotification,
                 Role role) {
        this.oauthId = oauthId;
        this.nickname = nickname;
        this.track = track;
        this.webPushNotification = webPushNotification;
        this.role = role;
    }

    public void register(String nickname,
                         Track track,
                         boolean webPushNotification,
                         Role role) {
        this.nickname = nickname;
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
}
