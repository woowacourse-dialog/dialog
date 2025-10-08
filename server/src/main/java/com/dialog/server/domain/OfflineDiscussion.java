package com.dialog.server.domain;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "offline_discussions")
public class OfflineDiscussion extends Discussion {

    private static final LocalTime MIN_START_AT = LocalTime.of(8, 0);
    private static final LocalTime MAX_START_AT = LocalTime.of(23, 0);
    private static final int MIN_ALLOWED_MAX_PARTICIPANTS = 1;
    private static final int MAX_ALLOWED_MAX_PARTICIPANTS = 10;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private String place;

    @Column(nullable = false)
    private int participantCount;

    @Column(nullable = false)
    private int maxParticipantCount;

    @OneToMany(mappedBy = "discussion")
    private final List<DiscussionParticipant> discussionParticipants = new ArrayList<>();

    public static Discussion withNoValidateOf(
            String title,
            String content,
            Category category,
            String summary,
            User author,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String place,
            int maxParticipantCount,
            int participantCount
    ) {
        OfflineDiscussion offlineDiscussion = new OfflineDiscussion();
        offlineDiscussion.title = title;
        offlineDiscussion.content = content;
        offlineDiscussion.category = category;
        offlineDiscussion.summary = summary;
        offlineDiscussion.author = author;
        offlineDiscussion.startAt = startAt;
        offlineDiscussion.endAt = endAt;
        offlineDiscussion.place = place;
        offlineDiscussion.maxParticipantCount = maxParticipantCount;
        offlineDiscussion.participantCount = participantCount;
        return offlineDiscussion;
    }

    @Builder
    private OfflineDiscussion(
            String title,
            String content,
            Category category,
            String summary,
            User author,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String place,
            int maxParticipantCount,
            int participantCount
    ) {
        super(title, content, category, summary, author);
        this.startAt = startAt;
        this.endAt = endAt;
        this.place = place;
        this.maxParticipantCount = maxParticipantCount;
        this.participantCount = participantCount;
        validateOfflineDiscussion();
    }

    private void validateOfflineDiscussion() {
        validateTime(startAt, endAt);
        validateMaxParticipantCount(maxParticipantCount);
    }

    private void validateTime(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt.isBefore(LocalDateTime.now())) {
            throw new DialogException(ErrorCode.INVALID_DISCUSSION_TIME);
        }

        if (startAt.isAfter(endAt) || endAt.isBefore(startAt)) {
            throw new DialogException(ErrorCode.INVALID_DISCUSSION_TIME);
        }

        LocalTime startTime = startAt.toLocalTime();
        if (startTime.isBefore(MIN_START_AT) || startTime.isAfter(MAX_START_AT)) {
            throw new DialogException(ErrorCode.INVALID_DISCUSSION_START_TIME);
        }
    }

    private void validateMaxParticipantCount(int maxParticipantCount) {
        if (maxParticipantCount < MIN_ALLOWED_MAX_PARTICIPANTS || maxParticipantCount > MAX_ALLOWED_MAX_PARTICIPANTS) {
            throw new DialogException(ErrorCode.INVALID_DISCUSSION_MAX_PARTICIPANTS);
        }
    }

    public void participate(LocalDateTime participateAt, DiscussionParticipant discussionParticipant) {
        validateAlreadyStarted(participateAt);
        validateExceedMaxParticipantCount();
        validateAlreadyParticipant(discussionParticipant);
        discussionParticipants.add(discussionParticipant);
        participantCount++;
    }

    private void validateAlreadyStarted(LocalDateTime participateAt) {
        if (startAt.isBefore(participateAt)) {
            throw new DialogException(ErrorCode.DISCUSSION_ALREADY_STARTED);
        }
    }

    private void validateExceedMaxParticipantCount() {
        if (discussionParticipants.size() >= maxParticipantCount) {
            throw new DialogException(ErrorCode.PARTICIPATION_LIMIT_EXCEEDED);
        }
    }

    private void validateAlreadyParticipant(DiscussionParticipant discussionParticipant) {
        for (DiscussionParticipant alreadyDiscussionParticipant : discussionParticipants) {
            if (alreadyDiscussionParticipant.isSameParticipant(discussionParticipant)) {
                throw new DialogException(ErrorCode.ALREADY_PARTICIPATION_DISCUSSION);
            }
        }
    }

    public void update(
            String title,
            String content,
            Category category,
            String summary,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String place,
            int maxParticipantCount
    ) {
        validateDiscussion(title, content);
        this.title = title;
        this.content = content;
        this.category = category;
        this.summary = summary;
        this.startAt = startAt;
        this.endAt = endAt;
        this.place = place;
        this.maxParticipantCount = maxParticipantCount;
        validateOfflineDiscussion();
    }

    @Override
    public boolean canNotDelete() {
    return LocalDateTime.now().isAfter(startAt);
    }

    @Override
    public DiscussionStatus getDiscussionStatus() {
        return DiscussionStatus.decideDiscussionStatus(
                this.startAt,
                this.endAt,
                this.participantCount,
                this.maxParticipantCount
        );
    }
}
