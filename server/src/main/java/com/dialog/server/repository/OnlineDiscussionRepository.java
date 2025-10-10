package com.dialog.server.repository;

import com.dialog.server.domain.OnlineDiscussion;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OnlineDiscussionRepository extends JpaRepository<OnlineDiscussion, Long> {
    @Query("""
            SELECT o
            FROM OnlineDiscussion o
            WHERE (o.summary IS NULL OR o.summary = '')
                AND o.endDate < :date
            """)
    List<OnlineDiscussion> findAllNeedingSummaryByEndDateBefore(@Param("date") LocalDate date);
}
