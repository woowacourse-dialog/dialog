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

    private String email;

    private String phoneNumber;
    // todo: user에 track
    // todo: 알림은 pushNotification 하나로 관리
    private boolean emailNotification;

    private boolean phoneNotification;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean isDeleted;

    @Builder
    private User(String oauthId,
                 String nickname,
                 String email,
                 String phoneNumber,
                 boolean emailNotification,
                 boolean phoneNotification,
                 Role role) {
        this.oauthId = oauthId;
        this.nickname = nickname;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.emailNotification = emailNotification;
        this.phoneNotification = phoneNotification;
        this.role = role;
    }

    public void register(String nickname,
                         String email,
                         String phoneNumber,
                         boolean emailNotification,
                         boolean phoneNotification,
                         Role role) {
        this.nickname = nickname;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.emailNotification = emailNotification;
        this.phoneNotification = phoneNotification;
        this.role = role;
    }

    public boolean isRegistered() {
        return !role.equals(Role.TEMP_USER);
    }

    public void updateNotificationSetting(boolean settingValue) {
        emailNotification = settingValue;
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
