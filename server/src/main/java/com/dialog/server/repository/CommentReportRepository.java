package com.dialog.server.repository;

import com.dialog.server.domain.CommentReport;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentReportRepository extends JpaRepository<CommentReport, Long> {

    boolean existsByReporterAndComment(User reporter, DiscussionComment comment);
}