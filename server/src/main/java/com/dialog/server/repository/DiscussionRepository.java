package com.dialog.server.repository;

import com.dialog.server.domain.Discussion;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DiscussionRepository extends JpaRepository<Discussion, Long>, DiscussionCustomRepository {

    @Query("""
        SELECT d
        FROM Discussion d
        WHERE d.createdAt <= :cursor OR (d.createdAt = :cursor AND d.id < :id)
        ORDER BY d.createdAt DESC , d.id DESC
        """)
    List<Discussion> findDiscussionsBeforeDateCursor(
            @Param("cursor")LocalDateTime cursor,
            @Param("id") Long id,
            Pageable pageable
    );

    @Query("""
            SELECT d
            FROM Discussion d
            ORDER BY d.createdAt DESC, d.id DESC
            """)
    List<Discussion> findFirstPageDiscussionsByDate(Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Discussion d WHERE d.id = :id")
    Optional<Discussion> findByIdForUpdate(@Param("id") Long id);
}
