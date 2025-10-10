package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionParticipant;
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

    @Transactional
    public void participate(Long userId, Long discussionId) {
        User participant = getUserById(userId);
        Discussion discussion = getDiscussionByIdWithLock(discussionId);
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

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    }

    private Discussion getDiscussionByIdWithLock(Long discussionId) {
        return discussionRepository.findByIdForUpdate(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
    }

    private Discussion getDiscussionById(Long discussionId) {
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
    }
}
