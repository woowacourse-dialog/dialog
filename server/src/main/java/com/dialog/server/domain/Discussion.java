package com.dialog.server.domain;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@Inheritance(strategy = InheritanceType.JOINED)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE discussions SET deleted_at = CURRENT_TIMESTAMP WHERE discussion_id = ?")
@SQLRestriction("deleted_at IS NULL")
@Table(name = "discussions")
@Entity
public abstract class Discussion extends BaseEntity {

    private static final int MAX_TITLE_LENGTH = 50;
    private static final int MAX_CONTENT_LENGTH = 10000;
    private static final int MAX_SUMMARY_LENGTH = 300;
    @Column(nullable = false)
    protected String title;
    @Column(nullable = false, columnDefinition = "TEXT")
    protected String content;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    protected Category category;
    @Column(columnDefinition = "TEXT")
    protected String summary;
    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    protected User author;
    @Column(name = "discussion_id", nullable = false)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;
    private LocalDateTime deletedAt;

    protected Discussion(
            String title,
            String content,
            Category category,
            String summary,
            User author
    ) {
        validateDiscussion(title, content);
        this.title = title;
        this.content = content;
        this.category = category;
        this.summary = summary;
        this.author = author;
    }

    protected void validateDiscussion(
            String title,
            String content
    ) {
        validateTitleLength(title);
        validateContentLength(content);
//        validateSummaryLength(summary);
    }

    private void validateTitleLength(String content) {
        if (content.isBlank() || content.length() > MAX_TITLE_LENGTH) {
            throw new DialogException(ErrorCode.INVALID_DISCUSSION_TITLE);
        }
    }

    private void validateContentLength(String content) {
        if (content.isBlank() || content.length() > MAX_CONTENT_LENGTH) {
            throw new DialogException(ErrorCode.INVALID_DISCUSSION_CONTENT);
        }
    }

    private void validateSummaryLength(String summary) { // TODO: 논의 필요
        if (summary.isBlank() || summary.length() > MAX_SUMMARY_LENGTH) {
            throw new DialogException(ErrorCode.INVALID_DISCUSSION_SUMMARY);
        }
    }

    public void updateSummary(String summary) {
        System.out.println(summary);
        this.summary = summary;
    }

    public abstract boolean canNotDelete(); // TODO: 삭제 논의

    public abstract DiscussionStatus getDiscussionStatus();

    public boolean hasSummary() {
        return !(this.summary == null || this.summary.isBlank());
    }

    public boolean isNotAuthor(Long userId) {
        return !Objects.equals(author.getId(), userId);
    }
}
