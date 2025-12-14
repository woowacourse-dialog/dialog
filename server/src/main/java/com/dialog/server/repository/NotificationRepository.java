package com.dialog.server.repository;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByReceiverAndIdGreaterThanOrderByCreatedAtAsc(User user, Long id);

    Long countByReceiverAndIsReadFalse(User receiver);
}
