package com.dialog.server.domain;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "discussions")
@Entity
public class Discussion extends BaseEntity {

    private static final int MAX_TITLE_LENGTH = 50;
    private static final int MAX_CONTENT_LENGTH = 10000;
    private static final int MAX_SUMMARY_LENGTH = 300;
    private static final LocalTime MIN_START_AT = LocalTime.of(8, 0);
    private static final LocalTime MAX_START_AT = LocalTime.of(23, 0);
    private static final int MIN_ALLOWED_MAX_PARTICIPANTS = 1;
    private static final int MAX_ALLOWED_MAX_PARTICIPANTS = 10;

    @Column(name = "discussion_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private String place;

    @Column(nullable = false)
    private int viewCount;

    @Column(nullable = false)
    private int participantCount;

    @Column(nullable = false)
    private int maxParticipantCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Category category;

    private String summary;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "discussion")
    private List<DiscussionParticipant> discussionParticipants = new ArrayList<>();

    @Builder
    public Discussion(String title,
                      String content,
                      LocalDateTime startAt,
                      LocalDateTime endAt,
                      String place,
                      int viewCount,
                      int participantCount,
                      int maxParticipantCount,
                      Category category,
                      String summary,
                      User author) {
        validateDiscussion(title,content,startAt,endAt,maxParticipantCount,summary);
        this.title = title;
        this.content = content;
        this.startAt = startAt;
        this.endAt = endAt;
        this.place = place;
        this.viewCount = viewCount;
        this.participantCount = participantCount;
        this.maxParticipantCount = maxParticipantCount;
        this.category = category;
        this.summary = summary;
        this.author = author;
    }

    private void validateDiscussion(
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt,
            int maxParticipantCount,
            String summary
    ) {
        validateTitleLength(title);
        validateContentLength(content);
        validateSummaryLength(summary);
        validateTime(startAt, endAt);
        validateMaxParticipantCount(maxParticipantCount);
    }

    private void validateTitleLength(String content) {
        if(content.isBlank() || content.length() > MAX_TITLE_LENGTH) {
            throw new IllegalArgumentException();
        }
    }

    private void validateContentLength(String content) {
        if(content.isBlank() || content.length() > MAX_CONTENT_LENGTH) {
            throw new IllegalArgumentException();
        }
    }

    private void validateSummaryLength(String summary) {
        if(summary.isBlank() || summary.length() > MAX_SUMMARY_LENGTH) {
            throw new IllegalArgumentException();
        }
    }

    private void validateTime(LocalDateTime startAt, LocalDateTime endAt) {
        if (startAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException();
        }

        if(startAt.isAfter(endAt) || endAt.isBefore(startAt)){
            throw new IllegalArgumentException();
        }

        LocalTime startTime = startAt.toLocalTime();
        if (startTime.isBefore(MIN_START_AT) || startTime.isAfter(MAX_START_AT)) {
            throw new IllegalArgumentException();
        }
    }

    private void validateMaxParticipantCount(int maxParticipantCount) {
        if (maxParticipantCount < MIN_ALLOWED_MAX_PARTICIPANTS || maxParticipantCount > MAX_ALLOWED_MAX_PARTICIPANTS) {
            throw new IllegalArgumentException();
        }
    }

    public void update(String title,
                       String content,
                       LocalDateTime startAt,
                       LocalDateTime endAt,
                       String place,
                       int maxParticipantCount,
                       Category category,
                       String summary) {
        this.title = title;
        this.content = content;
        this.startAt = startAt;
        this.endAt = endAt;
        this.place = place;
        this.maxParticipantCount = maxParticipantCount;
        this.category = category;
        this.summary = summary;
    }

    public boolean canNotDelete() {
        return LocalDateTime.now().isAfter(startAt);
    }

    public void delete() {
        deletedAt = LocalDateTime.now();
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
}
