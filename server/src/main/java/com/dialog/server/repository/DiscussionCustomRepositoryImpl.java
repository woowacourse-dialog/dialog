package com.dialog.server.repository;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionStatus;
import com.dialog.server.domain.DiscussionType;
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
            List<DiscussionType> discussionTypes,
            Pageable pageable) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(discussion.id.eq(offlineDiscussion.id))
                .leftJoin(onlineDiscussion).on(discussion.id.eq(onlineDiscussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        categoryIn(categories),
                        statusIn(statuses),
                        discussionTypeIn(discussionTypes)
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
            List<DiscussionType> discussionTypes,
            LocalDateTime cursor,
            Long id,
            int limit) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(discussion.id.eq(offlineDiscussion.id))
                .leftJoin(onlineDiscussion).on(discussion.id.eq(onlineDiscussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        categoryIn(categories),
                        statusIn(statuses),
                        discussionTypeIn(discussionTypes),
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
            List<DiscussionType> discussionTypes,
            Pageable pageable) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(discussion.id.eq(offlineDiscussion.id))
                .leftJoin(onlineDiscussion).on(discussion.id.eq(onlineDiscussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        titleOrContentContains(keyword),
                        categoryIn(categories),
                        statusIn(statuses),
                        discussionTypeIn(discussionTypes)
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
            List<DiscussionType> discussionTypes,
            LocalDateTime cursor,
            Long cursorId,
            int limit) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(discussion.id.eq(offlineDiscussion.id))
                .leftJoin(onlineDiscussion).on(discussion.id.eq(onlineDiscussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        titleOrContentContains(keyword),
                        categoryIn(categories),
                        statusIn(statuses),
                        discussionTypeIn(discussionTypes),
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
            List<DiscussionType> discussionTypes,
            Pageable pageable) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(discussion.id.eq(offlineDiscussion.id))
                .leftJoin(onlineDiscussion).on(discussion.id.eq(onlineDiscussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        nicknameContains(nickname),
                        categoryIn(categories),
                        statusIn(statuses),
                        discussionTypeIn(discussionTypes)
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
            List<DiscussionType> discussionTypes,
            LocalDateTime cursor,
            Long cursorId,
            int limit) {

        return queryFactory.selectFrom(discussion)
                .leftJoin(offlineDiscussion).on(discussion.id.eq(offlineDiscussion.id))
                .leftJoin(onlineDiscussion).on(discussion.id.eq(onlineDiscussion.id))
                .innerJoin(discussion.author, user).fetchJoin()
                .where(
                        nicknameContains(nickname),
                        categoryIn(categories),
                        statusIn(statuses),
                        discussionTypeIn(discussionTypes),
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

        for (DiscussionStatus status : statuses) {
            BooleanExpression statusCondition = createStatusCondition(status, now);
            condition = condition == null ? statusCondition : condition.or(statusCondition);
        }

        return condition;
    }

    private BooleanExpression createStatusCondition(
            DiscussionStatus status,
            final LocalDateTime now) {

        BooleanExpression onlineCondition = onlineDiscussion.id.isNotNull().and(
                switch (status) {
                    case IN_DISCUSSION -> onlineDiscussion.endDate.gt(LocalDate.from(now));

                    case DISCUSSION_COMPLETE -> onlineDiscussion.endDate.loe(LocalDate.from(now));

                    case RECRUITING, RECRUIT_COMPLETE -> null;
                }
        );

        BooleanExpression recruitingCondition = offlineDiscussion.startAt.gt(now)
                .and(offlineDiscussion.participantCount.lt(offlineDiscussion.maxParticipantCount));

        BooleanExpression recruitCompleteCondition = offlineDiscussion.startAt.gt(now)
                .and(offlineDiscussion.participantCount.goe(offlineDiscussion.maxParticipantCount));

        BooleanExpression inDiscussionCondition = offlineDiscussion.startAt.loe(now)
                .and(offlineDiscussion.endAt.goe(now));

        BooleanExpression discussionCompleteCondition = offlineDiscussion.endAt.lt(now);

        BooleanExpression offlineCondition = offlineDiscussion.id.isNotNull().and(
                switch (status) {
                    case RECRUITING -> recruitingCondition;
                    case RECRUIT_COMPLETE -> recruitCompleteCondition;
                    case IN_DISCUSSION -> inDiscussionCondition;
                    case DISCUSSION_COMPLETE -> discussionCompleteCondition;
                }
        );

        return switch (status) {
            case RECRUITING, RECRUIT_COMPLETE -> offlineCondition;
            case IN_DISCUSSION, DISCUSSION_COMPLETE -> onlineCondition.or(offlineCondition);
        };
    }

    private BooleanExpression cursorBefore(LocalDateTime cursor, Long cursorId) {
        if (cursor == null || cursorId == null) {
            return null;
        }
        return discussion.createdAt.lt(cursor)
                .or(discussion.createdAt.eq(cursor).and(discussion.id.lt(cursorId)));
    }

    private BooleanExpression discussionTypeIn(List<DiscussionType> discussionTypes) {
        if (discussionTypes == null || discussionTypes.isEmpty()) {
            return null;
        }

        BooleanExpression condition = null;
        for (DiscussionType type : discussionTypes) {
            BooleanExpression typeCondition = switch (type) {
                case OFFLINE -> offlineDiscussion.id.isNotNull();
                case ONLINE -> onlineDiscussion.id.isNotNull();
            };
            condition = condition == null ? typeCondition : condition.or(typeCondition);
        }
        return condition;
    }

    private boolean hasText(String text) {
        return text != null && !text.isBlank();
    }
}
