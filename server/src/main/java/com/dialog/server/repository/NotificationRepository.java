package com.dialog.server.repository;

import com.dialog.server.domain.Notification;
import com.dialog.server.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findAllByReceiverAndIdGreaterThanOrderByCreatedAtAsc(User user, Long id);

    Long countByReceiverAndIsReadFalse(User receiver);

    Page<Notification> findAllByReceiverOrderByCreatedAtDesc(User receiver, Pageable pageable);

    Optional<Notification> findByIdAndReceiver(Long notificationId, User receiver);
}
