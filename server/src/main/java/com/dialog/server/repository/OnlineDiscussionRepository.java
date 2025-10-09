package com.dialog.server.repository;

import com.dialog.server.domain.OnlineDiscussion;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnlineDiscussionRepository extends JpaRepository<OnlineDiscussion, Long> {
    List<OnlineDiscussion> findAllBySummaryIsNullAndEndDateBefore(LocalDate date);
}
