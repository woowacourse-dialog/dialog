package com.dialog.server.repository;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionStatus;
import com.dialog.server.domain.QDiscussion;
import com.dialog.server.domain.QOfflineDiscussion;
import com.dialog.server.domain.QOnlineDiscussion;
import com.dialog.server.domain.QUser;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.LocalDate;
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
    private final QOfflineDiscussion offlineDiscussion = QOfflineDiscussion.offlineDiscussion;
    private final QOnlineDiscussion onlineDiscussion = QOnlineDiscussion.onlineDiscussion;
    private final QUser user = QUser.user;

    @Override
    public List<Discussion> findWithFiltersPageable(
            List<Category> categories,
            List<DiscussionStatus> statuses,
            Pageable pageable) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(offlineDiscussion.id.eq(discussion.id))
                .leftJoin(onlineDiscussion).on(onlineDiscussion.id.eq(discussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        categoryIn(categories),
                        statusIn(statuses)
                )
                .orderBy(discussion.createdAt.desc(), discussion.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    @Override
    public List<Discussion> findWithFiltersBeforeDateCursor(
            List<Category> categories,
            List<DiscussionStatus> statuses,
            LocalDateTime cursor,
            Long id,
            int limit) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(offlineDiscussion.id.eq(discussion.id))
                .leftJoin(onlineDiscussion).on(onlineDiscussion.id.eq(discussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        categoryIn(categories),
                        statusIn(statuses),
                        cursorBefore(cursor, id)
                )
                .orderBy(discussion.createdAt.desc(), discussion.id.desc())
                .limit(limit)
                .fetch();
    }

    @Override
    public List<Discussion> findByTitleOrContentContainingWithFiltersPageable(
            String keyword,
            List<Category> categories,
            List<DiscussionStatus> statuses,
            Pageable pageable) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(offlineDiscussion.id.eq(discussion.id))
                .leftJoin(onlineDiscussion).on(onlineDiscussion.id.eq(discussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
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
    public List<Discussion> findByTitleOrContentContainingWithFiltersBeforeDateCursor(
            String keyword,
            List<Category> categories,
            List<DiscussionStatus> statuses,
            LocalDateTime cursor,
            Long cursorId,
            int limit) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(offlineDiscussion.id.eq(discussion.id))
                .leftJoin(onlineDiscussion).on(onlineDiscussion.id.eq(discussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
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

    @Override
    public List<Discussion> findByAuthorNicknameContainingWithFiltersPageable(
            String nickname,
            List<Category> categories,
            List<DiscussionStatus> statuses,
            Pageable pageable) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(offlineDiscussion.id.eq(discussion.id))
                .leftJoin(onlineDiscussion).on(onlineDiscussion.id.eq(discussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
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
    public List<Discussion> findByAuthorNicknameContainingWithFiltersBeforeDateCursor(
            String nickname,
            List<Category> categories,
            List<DiscussionStatus> statuses,
            LocalDateTime cursor,
            Long cursorId,
            int limit) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(offlineDiscussion.id.eq(discussion.id))
                .leftJoin(onlineDiscussion).on(onlineDiscussion.id.eq(discussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
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

    private BooleanExpression titleOrContentContains(String keyword) {
        if (!hasText(keyword)) {
            return null;
        }
        String trimmed = keyword.trim();
        return discussion.title.containsIgnoreCase(trimmed)
                .or(discussion.content.containsIgnoreCase(trimmed));
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
        LocalDate today = now.toLocalDate();

        for (DiscussionStatus status : statuses) {
            BooleanExpression statusCondition = createStatusCondition(status, now, today);
            condition = condition == null ? statusCondition : condition.or(statusCondition);
        }

        return condition;
    }

    private BooleanExpression createStatusCondition(
            DiscussionStatus status,
            LocalDateTime now,
            LocalDate today) {

        return switch (status) {
            case RECRUITING -> offlineDiscussion.isNotNull()
                    .and(offlineDiscussion.startAt.gt(now))
                    .and(offlineDiscussion.participantCount.lt(offlineDiscussion.maxParticipantCount));

            case RECRUIT_COMPLETE -> offlineDiscussion.isNotNull()
                    .and(offlineDiscussion.startAt.gt(now))
                    .and(offlineDiscussion.participantCount.goe(offlineDiscussion.maxParticipantCount));

            case IN_DISCUSSION ->
                // Offline: 시작 <= 현재 < 종료
                    offlineDiscussion.isNotNull()
                            .and(offlineDiscussion.startAt.loe(now))
                            .and(offlineDiscussion.endAt.gt(now))
                            // Online: 현재 <= 종료일
                            .or(onlineDiscussion.isNotNull()
                                    .and(onlineDiscussion.endDate.goe(today)));

            case DISCUSSION_COMPLETE ->
                // Offline: 종료 < 현재
                    offlineDiscussion.isNotNull()
                            .and(offlineDiscussion.endAt.lt(now))
                            // Online: 종료일 < 현재
                            .or(onlineDiscussion.isNotNull()
                                    .and(onlineDiscussion.endDate.lt(today)));
        };
    }

    private BooleanExpression cursorBefore(LocalDateTime cursor, Long cursorId) {
        if (cursor == null || cursorId == null) {
            return null;
        }
        return discussion.createdAt.lt(cursor)
                .or(discussion.createdAt.eq(cursor).and(discussion.id.lt(cursorId)));
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }
}
