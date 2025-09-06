package com.dialog.server.repository;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionParticipant;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionParticipantRepository extends JpaRepository<DiscussionParticipant, Long> {

    @EntityGraph(attributePaths = {"participant"})
    List<DiscussionParticipant> findByDiscussion(Discussion discussion);
}
