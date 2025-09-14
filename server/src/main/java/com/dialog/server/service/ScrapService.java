package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.ProfileImage;
import com.dialog.server.domain.Scrap;
import com.dialog.server.domain.User;
import com.dialog.server.dto.request.ScrapCursorPageRequest;
import com.dialog.server.dto.response.DiscussionPreviewResponse;
import com.dialog.server.dto.response.ScrapCursorPageResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.ProfileImageRepository;
import com.dialog.server.repository.ScrapRepository;
import com.dialog.server.repository.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ScrapService {

    private final ScrapRepository scrapRepository;
    private final UserRepository userRepository;
    private final DiscussionRepository discussionRepository;
    private final ProfileImageRepository profileImageRepository;

    @Transactional
    public void create(Long userId, Long discussionId) {
        User user = getUserById(userId);
        Discussion discussion = getDiscussionById(discussionId);
        if (isScraped(user, discussion)) {
            throw new DialogException(ErrorCode.ALREADY_SCRAPPED);
        }
        Scrap scrap = Scrap.builder()
                .user(user)
                .discussion(discussion)
                .build();
        scrapRepository.save(scrap);
    }

    @Transactional
    public void delete(Long userId, Long discussionId) {
        User user = getUserById(userId);
        Discussion discussion = getDiscussionById(discussionId);
        if (!isScraped(user, discussion)) {
            throw new DialogException(ErrorCode.NOT_SCRAPPED_YET);
        }
        scrapRepository.deleteByUserAndDiscussion(user, discussion);
    }

    @Transactional(readOnly = true)
    public ScrapCursorPageResponse<DiscussionPreviewResponse> getScrapedDiscussions(
            ScrapCursorPageRequest scrapCursorPageRequest, Long userId) {
        User user = getUserById(userId);
        List<Discussion> discussions = findScrapDiscussionsByCursor(scrapCursorPageRequest, user);
        return createCursorResponse(discussions, scrapCursorPageRequest.pageSize());
    }


    @Transactional(readOnly = true)
    public boolean isScraped(Long userId, Long discussionId) {
        User user = getUserById(userId);
        Discussion discussion = getDiscussionById(discussionId);
        return isScraped(user, discussion);
    }

    private List<Discussion> findScrapDiscussionsByCursor(ScrapCursorPageRequest scrapCursorPageRequest, User user) {
        PageRequest pageRequest = PageRequest.of(0, scrapCursorPageRequest.pageSize() + 1);
        if (scrapCursorPageRequest.lastCursorId() == null) {
            return scrapRepository.findFirstPageScrapDiscussionByUser(pageRequest, user);
        }
        return scrapRepository.findScrapDiscussionByUser(pageRequest, user, scrapCursorPageRequest.lastCursorId());
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(userId + "에 해당하는 user를 찾을 수 없습니다."));
    }

    private Discussion getDiscussionById(Long discussionId) {
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new IllegalArgumentException(discussionId + "에 해당하는 discussion을 찾을 수 없습니다."));
    }

    private boolean isScraped(User user, Discussion discussion) {
        return scrapRepository.existsByUserAndDiscussion(user, discussion);
    }

    private ScrapCursorPageResponse<DiscussionPreviewResponse> createCursorResponse(
            List<Discussion> discussions, int requestPageSize) {
        boolean hasNext = discussions.size() > requestPageSize;

        Long nextCursorId = null;

        List<Discussion> pagingDiscussions = new ArrayList<>(discussions);
        if (!pagingDiscussions.isEmpty() && hasNext) {
            Discussion cursorDiscussion = pagingDiscussions.getLast();
            pagingDiscussions = pagingDiscussions.subList(0, requestPageSize);
            nextCursorId = cursorDiscussion.getId();
        }

        Map<User, ProfileImage> userProfileImageMap = getAuthorProfileImages(pagingDiscussions);

        List<DiscussionPreviewResponse> responses = pagingDiscussions.stream()
                .map(discussion -> DiscussionPreviewResponse.from(
                                discussion,
                                userProfileImageMap.get(discussion.getAuthor())
                        )
                )
                .toList();

        return new ScrapCursorPageResponse<>(responses, nextCursorId, hasNext, requestPageSize);
    }

    private Map<User, ProfileImage> getAuthorProfileImages(List<Discussion> discussions) {
        List<User> discussionAuthors = discussions.stream().map(Discussion::getAuthor).toList();
        List<ProfileImage> discussionAuthorProfileImages = profileImageRepository.findAllByUserIn(discussionAuthors);
        return discussionAuthorProfileImages.stream()
                .collect(Collectors.toMap(ProfileImage::getUser, Function.identity()));
    }
}
