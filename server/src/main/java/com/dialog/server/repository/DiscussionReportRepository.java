package com.dialog.server.repository;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionReport;
import com.dialog.server.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionReportRepository extends JpaRepository<DiscussionReport, Long> {

    boolean existsByReporterAndDiscussion(User reporter, Discussion discussion);
}