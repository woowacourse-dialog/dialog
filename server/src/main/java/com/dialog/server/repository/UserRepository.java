package com.dialog.server.repository;

import com.dialog.server.domain.SocialType;
import com.dialog.server.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.deletedAt IS NULL")
    Optional<User> findById(@Param("id") Long id);

    @Query("SELECT u FROM User u WHERE u.oauthId = :oauthId AND u.socialType = :socialType AND u.deletedAt IS NULL")
    Optional<User> findByOauthIdAndSocialType(@Param("oauthId") String oauthId, @Param("socialType") SocialType socialType);

@Query("SELECT u FROM User u WHERE u.webPushNotification = :webPushNotification AND u.id != :id AND u.deletedAt IS NULL")
    List<User> findByWebPushNotificationAndIdNot(@Param("webPushNotification") boolean webPushNotification, @Param("id") Long id);
}
