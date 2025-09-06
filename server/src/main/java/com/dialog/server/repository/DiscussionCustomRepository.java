package com.dialog.server.repository;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionStatus;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;

public interface DiscussionCustomRepository {

    List<Discussion> findWithFiltersPageable(List<Category> categories, List<DiscussionStatus> statuses, Pageable pageable);

    List<Discussion> findWithFiltersBeforeDateCursor(List<Category> categories, List<DiscussionStatus> statuses, LocalDateTime cursor, Long id, int limit);

    List<Discussion> findByTitleOrContentContainingWithFiltersPageable(String keyword, List<Category> categories, List<DiscussionStatus> statuses, Pageable pageable);

    List<Discussion> findByTitleOrContentContainingWithFiltersBeforeDateCursor(String keyword, List<Category> categories, List<DiscussionStatus> statuses, LocalDateTime cursor, Long id, int limit);

    List<Discussion> findByAuthorNicknameContainingWithFiltersPageable(String nickname, List<Category> categories, List<DiscussionStatus> statuses, Pageable pageable);

    List<Discussion> findByAuthorNicknameContainingWithFiltersBeforeDateCursor(String nickname, List<Category> categories, List<DiscussionStatus> statuses, LocalDateTime cursor, Long id, int limit);
}
