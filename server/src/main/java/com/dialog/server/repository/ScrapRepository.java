package com.dialog.server.repository;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.Scrap;
import com.dialog.server.domain.User;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScrapRepository extends JpaRepository<Scrap, Long> {

    boolean existsByUserAndDiscussion(User user, Discussion discussion);

    void deleteByUserAndDiscussion(User user, Discussion discussion);

    @Query("""
            SELECT s.discussion
            FROM Scrap s
            inner join s.discussion
            WHERE s.user = :user AND s.id <= :lastScrapId
            ORDER BY s.id DESC
            """)
    List<Discussion> findScrapDiscussionByUser(Pageable pageable,
                                               @Param("user") User user,
                                               @Param("lastScrapId") Long lastScrapId);

    @Query("""
            SELECT s.discussion
            FROM Scrap s
            inner join s.discussion
            WHERE s.user = :user
            ORDER BY s.id DESC
            """)
    List<Discussion> findFirstPageScrapDiscussionByUser(Pageable pageable, @Param("user") User user);
}
