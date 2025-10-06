package com.dialog.server.repository;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionStatus;
import com.dialog.server.domain.QOfflineDiscussion;
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
    private final QOfflineDiscussion offlineDiscussion = QOfflineDiscussion.offlineDiscussion;
    private final QUser user = QUser.user;

    @Override
    public List<Discussion> findWithFiltersPageable(List<Category> categories, List<DiscussionStatus> statuses,
                                                    Pageable pageable) {
        return queryFactory.selectFrom(offlineDiscussion)
                .innerJoin(offlineDiscussion.author, user)
                .fetchJoin()
                .where(
                        categoryIn(categories),
                        statusIn(statuses)
                )
                .orderBy(offlineDiscussion.createdAt.desc(), offlineDiscussion.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch()
                .stream()
                .map(d -> (Discussion) d)
                .toList();
    }

    @Override
    public List<Discussion> findWithFiltersBeforeDateCursor(List<Category> categories, List<DiscussionStatus> statuses,
                                                            LocalDateTime cursor, Long id, int limit) {
        return queryFactory.selectFrom(offlineDiscussion)
                .innerJoin(offlineDiscussion.author, user)
                .fetchJoin()
                .where(
                        categoryIn(categories),
                        statusIn(statuses),
                        cursorBefore(cursor, id)
                )
                .orderBy(offlineDiscussion.createdAt.desc(), offlineDiscussion.id.desc())
                .limit(limit)
                .fetch()
                .stream()
                .map(d -> (Discussion) d)
                .toList();
    }

    @Override
    public List<Discussion> findByTitleOrContentContainingWithFiltersPageable(String keyword,
                                                                              List<Category> categories,
                                                                              List<DiscussionStatus> statuses,
                                                                              Pageable pageable) {
        return queryFactory.selectFrom(offlineDiscussion)
                .innerJoin(offlineDiscussion.author, user)
                .fetchJoin()
                .where(
                        titleOrContentContains(keyword),
                        categoryIn(categories),
                        statusIn(statuses)
                )
                .orderBy(offlineDiscussion.createdAt.desc(), offlineDiscussion.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch()
                .stream()
                .map(d -> (Discussion) d)
                .toList();
    }

    @Override
    public List<Discussion> findByTitleOrContentContainingWithFiltersBeforeDateCursor(String keyword,
                                                                                      List<Category> categories,
                                                                                      List<DiscussionStatus> statuses,
                                                                                      LocalDateTime cursor,
                                                                                      Long cursorId,
                                                                                      int limit) {
        return queryFactory.selectFrom(offlineDiscussion)
                .innerJoin(offlineDiscussion.author, user)
                .fetchJoin()
                .where(
                        titleOrContentContains(keyword),
                        categoryIn(categories),
                        statusIn(statuses),
                        cursorBefore(cursor, cursorId)
                )
                .orderBy(offlineDiscussion.createdAt.desc(), offlineDiscussion.id.desc())
                .limit(limit)
                .fetch()
                .stream()
                .map(d -> (Discussion) d)
                .toList();
    }

    private BooleanExpression titleOrContentContains(String keyword) {
        if (!hasText(keyword)) {
            return null;
        }
        final String trimmed = keyword.trim();
        return offlineDiscussion.title.containsIgnoreCase(trimmed)
                .or(offlineDiscussion.content.containsIgnoreCase(trimmed));
    }

    @Override
    public List<Discussion> findByAuthorNicknameContainingWithFiltersPageable(String nickname,
                                                                              List<Category> categories,
                                                                              List<DiscussionStatus> statuses,
                                                                              Pageable pageable) {
        return queryFactory.selectFrom(offlineDiscussion)
                .innerJoin(offlineDiscussion.author, user)
                .fetchJoin()
                .where(
                        nicknameContains(nickname),
                        categoryIn(categories),
                        statusIn(statuses)
                )
                .orderBy(offlineDiscussion.createdAt.desc(), offlineDiscussion.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch()
                .stream()
                .map(d -> (Discussion) d)
                .toList();
    }

    @Override
    public List<Discussion> findByAuthorNicknameContainingWithFiltersBeforeDateCursor(String nickname,
                                                                                      List<Category> categories,
                                                                                      List<DiscussionStatus> statuses,
                                                                                      LocalDateTime cursor,
                                                                                      Long cursorId,
                                                                                      int limit) {
        return queryFactory.selectFrom(offlineDiscussion)
                .innerJoin(offlineDiscussion.author, user)
                .fetchJoin()
                .where(
                        nicknameContains(nickname),
                        categoryIn(categories),
                        statusIn(statuses),
                        cursorBefore(cursor, cursorId)
                )
                .orderBy(offlineDiscussion.createdAt.desc(), offlineDiscussion.id.desc())
                .limit(limit)
                .fetch()
                .stream()
                .map(d -> (Discussion) d)
                .toList();
    }

    private BooleanExpression nicknameContains(String nickname) {
        return nickname != null ? user.nickname.containsIgnoreCase(nickname) : null;
    }

    private BooleanExpression categoryIn(List<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return null;
        }
        return offlineDiscussion.category.in(categories);
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
            case RECRUITING -> offlineDiscussion.startAt.gt(now)
                    .and(offlineDiscussion.participantCount.lt(offlineDiscussion.maxParticipantCount));
            case RECRUIT_COMPLETE -> offlineDiscussion.startAt.gt(now)
                    .and(offlineDiscussion.participantCount.goe(offlineDiscussion.maxParticipantCount));
            case IN_DISCUSSION -> offlineDiscussion.startAt.loe(now)
                    .and(offlineDiscussion.endAt.goe(now));
            case DISCUSSION_COMPLETE -> offlineDiscussion.endAt.lt(now);
        };
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }

    private BooleanExpression cursorBefore(LocalDateTime cursor, Long cursorId) {
        if (cursor == null || cursorId == null) {
            return null;
        }

        return offlineDiscussion.createdAt.loe(cursor)
                .or(offlineDiscussion.createdAt.eq(cursor).and(offlineDiscussion.id.gt(cursorId)));
    }
}
