package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.OfflineDiscussion;
import com.dialog.server.domain.User;
import com.dialog.server.dto.request.ParticipationStatusResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionParticipantRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DiscussionParticipantService {

    private final DiscussionParticipantRepository discussionParticipantRepository;
    private final UserRepository userRepository;
    private final DiscussionRepository discussionRepository;
    private final DiscussionParticipationExecutor participationExecutor;

    public void participate(Long userId, Long discussionId) {
        validateNotAlreadyParticipating(discussionId, userId);

        User participant = getUserById(userId);
        OfflineDiscussion offlineDiscussion = getOfflineDiscussion(discussionId);
        validateParticipable(offlineDiscussion);

        participationExecutor.execute(participant, discussionId);
    }

    @Transactional(readOnly = true)
    public ParticipationStatusResponse isParticipating(Long userId, Long discussionId) {
        User participant = getUserById(userId);
        Discussion discussion = getDiscussionById(discussionId);

        boolean isParticipation = discussionParticipantRepository.existsByDiscussionAndParticipant(
                discussion,
                participant
        );

        return new ParticipationStatusResponse(isParticipation);
    }

    private void validateNotAlreadyParticipating(Long discussionId, Long userId) {
        if (discussionParticipantRepository.existsByDiscussion_IdAndParticipant_Id(discussionId, userId)) {
            throw new DialogException(ErrorCode.ALREADY_PARTICIPATION_DISCUSSION);
        }
    }

    private OfflineDiscussion getOfflineDiscussion(Long discussionId) {
        Discussion discussion = getDiscussionById(discussionId);
        if (!(discussion instanceof OfflineDiscussion offlineDiscussion)) {
            throw new DialogException(ErrorCode.NOT_OFFLINE_DISCUSSION);
        }
        return offlineDiscussion;
    }

    private void validateParticipable(OfflineDiscussion offlineDiscussion) {
        if (offlineDiscussion.getStartAt().isBefore(LocalDateTime.now())) {
            throw new DialogException(ErrorCode.DISCUSSION_ALREADY_STARTED);
        }
        if (offlineDiscussion.getParticipantCount() >= offlineDiscussion.getMaxParticipantCount()) {
            throw new DialogException(ErrorCode.PARTICIPATION_LIMIT_EXCEEDED);
        }
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    }

    private Discussion getDiscussionById(Long discussionId) {
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
    }
}
