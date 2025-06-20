package com.dialog.server.repository;

import com.dialog.server.domain.MessagingToken;
import com.dialog.server.domain.User;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessagingTokenRepository extends JpaRepository<MessagingToken, Long> {
    List<MessagingToken> findMessagingTokensByUser(User user);

    List<MessagingToken> findByUserIdIn(Collection<Long> userIds);
}
