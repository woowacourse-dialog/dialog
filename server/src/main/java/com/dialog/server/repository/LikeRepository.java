package com.dialog.server.repository;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.Like;
import com.dialog.server.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LikeRepository extends JpaRepository<Like, Long> {

    boolean existsByUserAndDiscussion(User user, Discussion discussion);

    void deleteByUserAndDiscussion(User user, Discussion discussion);

    long countByDiscussion(Discussion discussion);
}

