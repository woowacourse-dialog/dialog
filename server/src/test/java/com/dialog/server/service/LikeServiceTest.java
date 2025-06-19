package com.dialog.server.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dialog.server.config.JpaConfig;
import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.Like;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.LikeRepository;
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
class LikeServiceTest {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    private LikeService likeService;

    @BeforeEach
    void setUp() {
        likeService = new LikeService(likeRepository, userRepository, discussionRepository);
    }

    @Test
    void 사용자는_토론에_좋아요를_할_수_있다() {
        //given
        User user = createUser();
        Discussion discussion = createDiscussion(user);

        //when
        likeService.create(user.getId(), discussion.getId());

        //then
        assertThat(likeRepository.findById(1L))
                .isPresent().get()
                .extracting("id", "discussion", "user")
                .contains(1L, discussion, user);
    }

    @Test
    void 좋아요를_할때_사용자가_토론에_이미_좋아요를_했다면_예외가_발생한다() {
        //given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        createLike(user, discussion);

        //when
        //then
        assertThatThrownBy(() -> likeService.create(user.getId(), discussion.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.ALREADY_LIKED.message);
    }

    @Test
    void 사용자는_토론에_대해_좋아요를_취소할_수_있다() {
        //given
        User user = createUser();
        Discussion discussion = createDiscussion(user);
        createLike(user, discussion);

        //when
        likeService.delete(user.getId(), discussion.getId());

        //then
        assertThat(likeRepository.findById(1L))
                .isNotPresent();
    }

    @Test
    void 좋아요를_삭제할때_사용자가_토론에_대해_좋아요를_하지_않은_상태라면_예외가_발생한다() {
        //given
        User user = createUser();
        Discussion discussion = createDiscussion(user);

        //when
        //then
        assertThatThrownBy(() -> likeService.delete(user.getId(), discussion.getId()))
                .isInstanceOf(DialogException.class)
                .hasMessage(ErrorCode.NOT_LIKED_YET.message);
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

    private Like createLike(User user, Discussion discussion) {
        Like like = Like.builder()
                .user(user)
                .discussion(discussion)
                .build();
        return likeRepository.save(like);
    }
}
