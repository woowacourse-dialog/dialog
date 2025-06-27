package com.dialog.server.repository;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionStatus;
import com.dialog.server.domain.QDiscussion;
import com.dialog.server.domain.QUser;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

@RequiredArgsConstructor
@Repository
public class DiscussionCustomRepositoryImpl implements DiscussionCustomRepository {

    private final JPAQueryFactory queryFactory;
    private final QDiscussion discussion = QDiscussion.discussion;
    private final QUser user = QUser.user;

    @Override
    public List<Discussion> findByTitleOrContentContainingWithFiltersPageable(String keyword,
                                                                              List<Category> categories,
                                                                              List<DiscussionStatus> statuses,
                                                                              Pageable pageable) {
        return queryFactory.selectFrom(discussion)
                .innerJoin(discussion.author, user)
                .fetchJoin()
                .where(
                        titleOrContentContains(keyword),
                        categoryIn(categories),
                        statusIn(statuses)
                )
                .orderBy(discussion.createdAt.desc(), discussion.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<Discussion> findByTitleOrContentContainingWithFiltersBeforeDateCursor(String keyword,
                                                                                      List<Category> categories,
                                                                                      List<DiscussionStatus> statuses,
                                                                                      LocalDateTime cursor,
                                                                                      Long cursorId,
                                                                                      int limit) {
        return queryFactory.selectFrom(discussion)
                .innerJoin(discussion.author, user)
                .fetchJoin()
                .where(
                        titleOrContentContains(keyword),
                        categoryIn(categories),
                        statusIn(statuses),
                        cursorBefore(cursor, cursorId)
                )
                .orderBy(discussion.createdAt.desc(), discussion.id.desc())
                .limit(limit)
                .fetch();
    }

    private BooleanExpression titleOrContentContains(String keyword) {
        if (!hasText(keyword)) {
            return null;
        }
        final String trimmed = keyword.trim();
        return discussion.title.containsIgnoreCase(trimmed)
                .or(discussion.content.containsIgnoreCase(trimmed));
    }

    @Override
    public List<Discussion> findByAuthorNicknameContainingWithFiltersPageable(String nickname,
                                                                              List<Category> categories,
                                                                              List<DiscussionStatus> statuses,
                                                                              Pageable pageable) {
        return queryFactory.selectFrom(discussion)
                .innerJoin(discussion.author, user)
                .fetchJoin()
                .where(
                        nicknameContains(nickname),
                        categoryIn(categories),
                        statusIn(statuses)
                )
                .orderBy(discussion.createdAt.desc(), discussion.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<Discussion> findByAuthorNicknameContainingWithFiltersBeforeDateCursor(String nickname,
                                                                                      List<Category> categories,
                                                                                      List<DiscussionStatus> statuses,
                                                                                      LocalDateTime cursor,
                                                                                      Long cursorId,
                                                                                      int limit) {
        return queryFactory.selectFrom(discussion)
                .innerJoin(discussion.author, user)
                .fetchJoin()
                .where(
                        nicknameContains(nickname),
                        categoryIn(categories),
                        statusIn(statuses),
                        cursorBefore(cursor, cursorId)
                )
                .orderBy(discussion.createdAt.desc(), discussion.id.desc())
                .limit(limit)
                .fetch();
    }

    private BooleanExpression nicknameContains(String nickname) {
        return nickname != null ? user.nickname.containsIgnoreCase(nickname) : null;
    }

    private BooleanExpression categoryIn(List<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return null;
        }
        return discussion.category.in(categories);
    }

    private BooleanExpression statusIn(List<DiscussionStatus> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return null;
        }

        BooleanExpression condition = null;
        LocalDateTime now = LocalDateTime.now();

        for (DiscussionStatus status : statuses) {
            BooleanExpression statusCondition = createStatusCondition(status, now);
            condition = condition == null ? statusCondition : condition.or(statusCondition);
        }

        return condition;
    }

    private BooleanExpression createStatusCondition(DiscussionStatus status, LocalDateTime now) {
        return switch (status) {
            case RECRUITING -> discussion.startAt.gt(now)
                    .and(discussion.participantCount.lt(discussion.maxParticipantCount));
            case RECRUIT_COMPLETE -> discussion.startAt.gt(now)
                    .and(discussion.participantCount.goe(discussion.maxParticipantCount));
            case IN_DISCUSSION -> discussion.startAt.loe(now)
                    .and(discussion.endAt.goe(now));
            case DISCUSSION_COMPLETE -> discussion.endAt.lt(now);
        };
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }

    private BooleanExpression cursorBefore(LocalDateTime cursor, Long cursorId) {
        if (cursor == null || cursorId == null) {
            return null;
        }

        return discussion.createdAt.loe(cursor)
                .or(discussion.createdAt.eq(cursor).and(discussion.id.gt(cursorId)));
    }
}
