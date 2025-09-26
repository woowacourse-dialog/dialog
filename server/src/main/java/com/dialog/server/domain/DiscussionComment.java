package com.dialog.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SQLDelete(sql = "UPDATE discussion_comments SET deleted_at = CURRENT_TIMESTAMP WHERE discussion_comment_id = ?")
@SQLRestriction("deleted_at IS NULL")
@Table(name = "discussion_comments")
@Entity
public class DiscussionComment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "discussion_comment_id")
    private Long id;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "discussion_id", nullable = false)
    private Discussion discussion;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne
    @JoinColumn(name = "parent_discussion_comment_id")
    private DiscussionComment parentDiscussionComment;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Builder
    public DiscussionComment(
            String content,
            Discussion discussion,
            User author,
            DiscussionComment parentDiscussionComment
    ) {
        this.content = content;
        this.discussion = discussion;
        this.author = author;
        this.parentDiscussionComment = parentDiscussionComment;
    }
}


