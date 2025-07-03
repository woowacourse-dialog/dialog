package com.dialog.server.service;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionParticipant;
import com.dialog.server.domain.DiscussionStatus;
import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.User;
import com.dialog.server.dto.request.DiscussionCreateRequest;
import com.dialog.server.dto.request.DiscussionCursorPageRequest;
import com.dialog.server.dto.request.DiscussionUpdateRequest;
import com.dialog.server.dto.request.SearchType;
import com.dialog.server.dto.response.DiscussionCreateResponse;
import com.dialog.server.dto.response.DiscussionCursorPageResponse;
import com.dialog.server.dto.response.DiscussionDetailResponse;
import com.dialog.server.dto.response.DiscussionPreviewResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionParticipantRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.LikeRepository;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiscussionService {

    private static final String CURSOR_PART_DELIMITER = "_";
    private static final int CURSOR_TIME_INDEX = 0;
    private static final int CURSOR_ID_INDEX = 1;
    private static final int MAX_PAGE_SIZE = 50;

    private final DiscussionRepository discussionRepository;
    private final DiscussionParticipantRepository discussionParticipantRepository;
    private final LikeRepository likeRepository;
    private final UserRepository userRepository;
    private final ProfileImageRepository profileImageRepository;

    @Transactional
    public DiscussionCreateResponse createDiscussion(DiscussionCreateRequest request, Long userId) {
        User author = getUser(userId);
        Discussion discussion = request.toDiscussion(author);
        try {
            Discussion savedDiscussion = discussionRepository.save(discussion);
            return DiscussionCreateResponse.from(savedDiscussion);
        } catch (IllegalArgumentException ex) {
            throw new DialogException(ErrorCode.CREATE_DISCUSSION_FAILED);
        }
    }

    @Transactional
    public void updateDiscussion(Long discussionId, DiscussionUpdateRequest request) {
        Discussion savedDiscussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
        savedDiscussion.update(
                request.title(),
                request.content(),
                request.startAt(),
                request.endAt(),
                request.place(),
                request.maxParticipantCount(),
                request.category(),
                request.summary()
        );
    }

    @Transactional(readOnly = true)
    public DiscussionDetailResponse getDiscussionById(Long discussionId) {
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
        User author = discussion.getAuthor();
        ProfileImage profileImage = profileImageRepository.findByUser(author).orElse(null);
        List<DiscussionParticipant> discussionParticipants = discussionParticipantRepository.findByDiscussion(
                discussion
        );
        long likeCount = likeRepository.countByDiscussion(discussion);
        return DiscussionDetailResponse.of(discussion, likeCount, discussionParticipants, profileImage);
    }

    @Transactional
    public void deleteDiscussion(Long discussionId) {
        Discussion deleteDiscussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
        if (deleteDiscussion.canNotDelete()) {
            throw new DialogException(ErrorCode.CANNOT_DELETE_DISCUSSION);
        }
        deleteDiscussion.delete();
    }

    @Transactional(readOnly = true)
    public DiscussionCursorPageResponse<DiscussionPreviewResponse> getDiscussionsPage(
            List<Category> categories,
            List<DiscussionStatus> statuses,
            DiscussionCursorPageRequest request) {
        int pageSize = request.size();
        String cursor = request.cursor();

        List<Discussion> discussions;

        if (cursor == null || cursor.isEmpty()) {
            discussions = discussionRepository.findWithFiltersPageable(categories, statuses, PageRequest.of(0, pageSize + 1));
//            discussions = discussionRepository.findFirstPageDiscussionsByDate(PageRequest.of(0, pageSize + 1));
        } else {
            String[] cursorParts = cursor.split(CURSOR_PART_DELIMITER);
            LocalDateTime cursorTime = LocalDateTime.parse(cursorParts[CURSOR_TIME_INDEX]);
            Long cursorId = Long.valueOf(cursorParts[CURSOR_ID_INDEX]);

            discussions = discussionRepository.findWithFiltersBeforeDateCursor(
                    categories,
                    statuses,
                    cursorTime,
                    cursorId,
                    pageSize + 1
            );
//            discussions = discussionRepository.findDiscussionsBeforeDateCursor(
//                    cursorTime,
//                    cursorId,
//                    PageRequest.of(0, pageSize + 1)
//            );
        }

        return buildDateCursorResponse(discussions, pageSize);
    }

    @Transactional(readOnly = true)
    public DiscussionCursorPageResponse<DiscussionPreviewResponse> searchDiscussionWithFilters(SearchType searchType,
                                                                                               String query,
                                                                                               List<Category> categories,
                                                                                               List<DiscussionStatus> statuses,
                                                                                               String cursor,
                                                                                               int size) {
        validatePageSize(size);
        List<Discussion> discussions;
        switch (searchType) {
            case TITLE_OR_CONTENT -> discussions = searchDiscussionByTitleOrContentWithFilters(query, categories, statuses, cursor, size);
            case AUTHOR_NICKNAME -> discussions = searchDiscussionByAuthorNicknameWithFilters(query, categories, statuses, cursor, size);
            default -> throw new DialogException(ErrorCode.INVALID_SEARCH_TYPE);
        }
        return buildDateCursorResponse(discussions, size);
    }

    @Transactional(readOnly = true)
    public DiscussionCursorPageResponse<DiscussionPreviewResponse> getDiscussionByAuthorId(
            DiscussionCursorPageRequest request,
            Long authorId) {
        int pageSize = request.size();
        String cursor = request.cursor();

        validatePageSize(pageSize);

        User author = getUser(authorId);

        return createCursorBasedDiscussionsByAuthor(cursor, pageSize, author);
    }

    private DiscussionCursorPageResponse<DiscussionPreviewResponse> createCursorBasedDiscussionsByAuthor(
            String cursor, int pageSize, User author) {
        List<Discussion> discussions;
        if (cursor == null || cursor.isEmpty()) {
            discussions = discussionRepository.findFirstPageDiscussionsByAuthorOrderByDate(
                    PageRequest.of(0, pageSize + 1),
                    author
            );
        } else {
            String[] cursorParts = cursor.split(CURSOR_PART_DELIMITER);
            LocalDateTime cursorTime = LocalDateTime.parse(cursorParts[CURSOR_TIME_INDEX]);
            Long cursorId = Long.valueOf(cursorParts[CURSOR_ID_INDEX]);

            discussions = discussionRepository.findDiscussionsByAuthorBeforeDateCursor(
                    cursorTime,
                    cursorId,
                    author,
                    PageRequest.of(0, pageSize + 1)
            );
        }

        return buildDateCursorResponse(discussions, pageSize);
    }

    private User getUser(Long authorId) {
        return userRepository.findById(authorId)
                .orElseThrow(() -> new DialogException(ErrorCode.USER_NOT_FOUND));
    }

    private void validatePageSize(int size) {
        if (size > MAX_PAGE_SIZE) {
            throw new DialogException(ErrorCode.PAGE_SIZE_TOO_LARGE);
        }
    }

    private List<Discussion> searchDiscussionByTitleOrContentWithFilters(String query,
                                                                         List<Category> categories,
                                                                         List<DiscussionStatus> statuses,
                                                                         String cursor,
                                                                         int size) {
        List<Discussion> discussions;
        if (cursor == null || cursor.isEmpty()) {
            discussions = discussionRepository.findByTitleOrContentContainingWithFiltersPageable(
                    query,
                    categories,
                    statuses,
                    PageRequest.of(0, size + 1)
            );
        } else {
            String[] cursorParts = cursor.split(CURSOR_PART_DELIMITER);
            LocalDateTime cursorTime = LocalDateTime.parse(cursorParts[CURSOR_TIME_INDEX]);
            Long cursorId = Long.valueOf(cursorParts[CURSOR_ID_INDEX]);

            discussions = discussionRepository.findByTitleOrContentContainingWithFiltersBeforeDateCursor(
                    query,
                    categories,
                    statuses,
                    cursorTime,
                    cursorId,
                    size + 1
            );
        }
        return discussions;
    }

    private List<Discussion> searchDiscussionByAuthorNicknameWithFilters(String query,
                                                                         List<Category> categories,
                                                                         List<DiscussionStatus> statuses,
                                                                         String cursor,
                                                                         int size) {
        List<Discussion> discussions;
        if (cursor == null || cursor.isEmpty()) {
            discussions = discussionRepository.findByAuthorNicknameContainingWithFiltersPageable(
                    query,
                    categories,
                    statuses,
                    PageRequest.of(0, size + 1)
            );
        } else {
            String[] cursorParts = cursor.split(CURSOR_PART_DELIMITER);
            LocalDateTime cursorTime = LocalDateTime.parse(cursorParts[CURSOR_TIME_INDEX]);
            Long cursorId = Long.valueOf(cursorParts[CURSOR_ID_INDEX]);

            discussions = discussionRepository.findByAuthorNicknameContainingWithFiltersBeforeDateCursor(
                    query,
                    categories,
                    statuses,
                    cursorTime,
                    cursorId,
                    size + 1
            );
        }
        return discussions;
    }

    private DiscussionCursorPageResponse<DiscussionPreviewResponse> buildDateCursorResponse(
            List<Discussion> discussions, int pageSize) {
        boolean hasNext = discussions.size() > pageSize;

        String nextCursor = null;

        List<Discussion> pagingDiscussions = new ArrayList<>(discussions);

        if (!pagingDiscussions.isEmpty() && hasNext) {
            Discussion cursorDiscussion = pagingDiscussions.getLast();
            pagingDiscussions = pagingDiscussions.subList(0, pageSize);
            nextCursor = cursorDiscussion.getCreatedAt().toString() + CURSOR_PART_DELIMITER + cursorDiscussion.getId();
        }

        List<DiscussionPreviewResponse> responses = pagingDiscussions.stream()
                .map(DiscussionPreviewResponse::from)
                .toList();
        return new DiscussionCursorPageResponse<>(responses, nextCursor, hasNext, pageSize);
    }
}
