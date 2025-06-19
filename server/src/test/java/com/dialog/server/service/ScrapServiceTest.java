package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.Scrap;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.ScrapRepository;
import com.dialog.server.repository.UserRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalTime;

@Import(JpaConfig.class)
@ActiveProfiles("test")
@DataJpaTest
class ScrapServiceTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private ScrapRepository scrapRepository;

    private ScrapService scrapService;

    @BeforeEach
    void setUp() {
        scrapService = new ScrapService(scrapRepository, userRepository, discussionRepository);
    }

    @Test
    void 사용자는_토론에_북마크를_할_수_있다() {
        //given
        User user = createUser();
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
        User user = createUser();
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
        User user = createUser();
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
        User user = createUser();
        Discussion discussion = createDiscussion(user);

        //when
        assertThatThrownBy(() -> scrapService.delete(user.getId(), discussion.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.NOT_SCRAPPED_YET.message);
    }

    private User createUser() {
        User user = User.builder()
                .email("email")
                .nickname("test")
                .emailNotification(false)
                .phoneNotification(false)
                .phoneNumber("111-111-1111")
                .build();
        return userRepository.save(user);
    }

    private Discussion createDiscussion(User user) {
        Discussion discussion = Discussion.builder()
                .author(user)
                .category(Category.ANDROID)
                .content("content")
                .startAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15,0)).plusMinutes(15))
                .endAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15,0)).plusMinutes(30))
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
