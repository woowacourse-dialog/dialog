package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionParticipant;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionParticipantRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
        discussion.participate(LocalDateTime.now(), discussionParticipant);
        discussionParticipantRepository.save(discussionParticipant);
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    }

    private Discussion getDiscussionByIdWithLock(Long discussionId) {
        return discussionRepository.findByIdForUpdate(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
    }
}
