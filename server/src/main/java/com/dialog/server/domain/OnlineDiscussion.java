package com.dialog.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "online_discussions")
public class OnlineDiscussion extends Discussion {
    @Column(nullable = false)
    private LocalDate endDate;

    @Builder
    private OnlineDiscussion(
            String title,
            String content,
            Category category,
            String summary,
            User author,
            LocalDate endDate
    ) {
        super(title, content, category, summary, author);
        this.endDate = endDate;
//        validateEndDate(endDate);
    }

//    private void validateEndDate(LocalDate endDate) { // TODO: 이건 서비스 레이어에서 검증하는게 나으려나?
//        LocalDate now = LocalDate.now();
//        LocalDate maxEndDate = now.plusDays(3);
//
//        if (endDate.isBefore(now) || endDate.isAfter(maxEndDate)) {
//            throw new DialogException(ErrorCode.INVALID_DISCUSSION_END_DATE);
//        }
//    }

    @Override
    public boolean canNotDelete() {
        return false;
    }

    public void update(
            String title,
            String content,
            Category category,
            String summary,
            LocalDate endDate
    ) {
        validateDiscussion(title, content);
        this.title = title;
        this.content = content;
        this.category = category;
        this.summary = summary;
        this.endDate = endDate;
    }

    @Override
    public DiscussionStatus getDiscussionStatus() {
        final LocalDate now = LocalDate.now();
        if (now.isAfter(endDate)) {
            return DiscussionStatus.DISCUSSION_COMPLETE;
        }
        return DiscussionStatus.IN_DISCUSSION;
    }
}
