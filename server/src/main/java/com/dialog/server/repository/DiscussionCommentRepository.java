package com.dialog.server.repository;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionCommentRepository extends JpaRepository<DiscussionComment, Long> {

    List<DiscussionComment> findByParentDiscussionComment(DiscussionComment parentDiscussionComment);

    long countByDiscussionId(Long discussionId);

    List<DiscussionComment> findByDiscussion(Discussion discussion);
}
