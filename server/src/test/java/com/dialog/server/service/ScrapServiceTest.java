package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.assertj.core.api.SoftAssertions.assertSoftly;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.Scrap;
import com.dialog.server.domain.User;
import com.dialog.server.dto.request.ScrapCursorPageRequest;
import com.dialog.server.dto.response.DiscussionPreviewResponse;
import com.dialog.server.dto.response.ScrapCursorPageResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.ScrapRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@Import(JpaConfig.class)
@ActiveProfiles("test")
@SpringBootTest
@Transactional
class ScrapServiceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private ScrapRepository scrapRepository;

    @Autowired
    private ScrapService scrapService;
    
    @Test
    void 사용자는_토론에_북마크를_할_수_있다() {
        //given
        User user = createUser("email@email.com");
        Discussion discussion = createDiscussion(user);

        //when
        scrapService.create(user.getId(), discussion.getId());

        //then
        assertThat(scrapRepository.findAll())
                .extracting("user", "discussion")
                .contains(tuple(user, discussion));
    }

    @Test
    void 북마크를_할떄_사용자가_이미_북마크가_되어있다면_예외가_발생한다() {
        //given
        User user = createUser("email@email.com");
        Discussion discussion = createDiscussion(user);
        createScrap(user, discussion);

        //when
        assertThatThrownBy(() -> scrapService.create(user.getId(), discussion.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.ALREADY_SCRAPPED.message);
    }

    @Test
    void 사용자는_토론에_대해_북마크를_취소할_수_있다() {
        //given
        User user = createUser("email@email.com");
        Discussion discussion = createDiscussion(user);
        Scrap scrap = createScrap(user, discussion);

        //when
        scrapService.delete(user.getId(), discussion.getId());

        //then
        assertThat(scrapRepository.findById(scrap.getId()))
                .isNotPresent();
    }

    @Test
    void 북마크를_삭제할떄_사용자가_북마크가_되어있지_않다면_예외가_발생한다() {
        //given
        User user = createUser("email@email.com");
        Discussion discussion = createDiscussion(user);

        //when
        assertThatThrownBy(() -> scrapService.delete(user.getId(), discussion.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.NOT_SCRAPPED_YET.message);
    }

    private User createUser(String email) {
        User user = User.builder()
                .nickname("test")
                .webPushNotification(false)
                .build();
        return userRepository.save(user);
    }

    @Test
    void 사용자가_스크랩한_토론을_커서_기반으로_조회할_수_있다() {
        //given
        User user1 = createUser("email1@email.com");
        User user2 = createUser("email2@email.com");

        Discussion discussion1 = createDiscussion(user1);
        Discussion discussion2 = createDiscussion(user1);
        createDiscussion(user1);
        Discussion discussion4 = createDiscussion(user1);
        Discussion discussion5 = createDiscussion(user1);

        createScrap(user2, discussion1);
        Scrap scrap2 = createScrap(user2, discussion2);
        createScrap(user2, discussion4);
        createScrap(user2, discussion5);

        //when
        ScrapCursorPageResponse<DiscussionPreviewResponse> result1 = scrapService.getScrapedDiscussions(
                new ScrapCursorPageRequest(null, 2), user2.getId());
        ScrapCursorPageResponse<DiscussionPreviewResponse> result2 = scrapService.getScrapedDiscussions(
                new ScrapCursorPageRequest(result1.nextCursorId(), 2), user2.getId());

        //then
        assertSoftly(softly -> {
            softly.assertThat(result1.content()).hasSize(2);
            softly.assertThat(result1.hasNext()).isTrue();
            softly.assertThat(result1.nextCursorId()).isEqualTo(scrap2.getId());
            softly.assertThat(result1.content()).extracting("id")
                    .containsExactly(discussion5.getId(), discussion4.getId());
            softly.assertThat(result2.content()).hasSize(2);
            softly.assertThat(result2.hasNext()).isFalse();
            softly.assertThat(result2.nextCursorId()).isNull();
            softly.assertThat(result2.content()).extracting("id")
                    .containsExactly(discussion2.getId(), discussion1.getId());
        });
    }

    private Discussion createDiscussion(User user) {
        Discussion discussion = Discussion.builder()
                .author(user)
                .category(Category.ANDROID)
                .content("content")
                .startAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(15))
                .endAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15, 0)).plusMinutes(30))
                .title("title")
                .maxParticipantCount(3)
                .participantCount(3)
                .place("place")
                .viewCount(3)
                .summary("summary")
                .build();
        return discussionRepository.save(discussion);
    }

    private Scrap createScrap(User user, Discussion discussion) {
        Scrap scrap = Scrap.builder()
                .user(user)
                .discussion(discussion)
                .build();
        return scrapRepository.save(scrap);
    }
}
