package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionParticipant;
import com.dialog.server.domain.OfflineDiscussion;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.lock.DiscussionLock;
import com.dialog.server.repository.DiscussionParticipantRepository;
import com.dialog.server.repository.DiscussionRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DiscussionParticipationExecutor {

    private final DiscussionRepository discussionRepository;
    private final DiscussionParticipantRepository discussionParticipantRepository;

    @DiscussionLock(key = "#discussionId")
    @Transactional
    public void execute(User participant, Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
        DiscussionParticipant discussionParticipant = DiscussionParticipant.builder()
                .participant(participant)
                .discussion(discussion)
                .build();

        if (!(discussion instanceof OfflineDiscussion offlineDiscussion)) {
            throw new DialogException(ErrorCode.NOT_OFFLINE_DISCUSSION);
        }
        offlineDiscussion.participate(LocalDateTime.now(), discussionParticipant);
        discussionParticipantRepository.save(discussionParticipant);
    }
}
