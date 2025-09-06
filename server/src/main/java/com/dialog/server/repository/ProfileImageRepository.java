package com.dialog.server.repository;

import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileImageRepository extends JpaRepository<ProfileImage, Long> {
    Optional<ProfileImage> findByUser(User user);

    boolean existsByUser(User user);
}
