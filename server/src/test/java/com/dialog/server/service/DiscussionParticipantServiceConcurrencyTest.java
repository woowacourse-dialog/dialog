package com.dialog.server.service;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.User;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionParticipantRepository;
import com.dialog.server.repository.DiscussionRepository;
import com.dialog.server.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.SoftAssertions.assertSoftly;

@ActiveProfiles("test")
@SpringBootTest
class DiscussionParticipantServiceConcurrencyTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiscussionRepository discussionRepository;

    @Autowired
    private DiscussionParticipantRepository discussionParticipantRepository;

    @Autowired
    private DiscussionParticipantService discussionParticipantService;

    @BeforeEach
    void beforeEach() {
        discussionParticipantRepository.deleteAll();
        discussionRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void 동시에_여러명이_참여를_시도해도_참여_인원이_예상대로_증가한다() throws InterruptedException {
        // given
        List<User> users = List.of(
                createUser("email1@gmail.com"), createUser("email2@gmail.com"),
                createUser("email3@gmail.com"), createUser("email4@gmail.com"),
                createUser("email5@gmail.com"), createUser("email6@gmail.com")
        );
        userRepository.saveAll(users);
        Discussion discussion = createDiscussion(createUser("admin@admin.com"),
                6,
                0,
                LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15,0)).plusMinutes(15)
        );

        int threadCount = users.size();
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);

        // when
        for (User user : users) {
            executorService.submit(() -> {
                try {
                    discussionParticipantService.participate(user.getId(), discussion.getId());
                } catch (Exception e) {
                } finally {
                    latch.countDown();
                }
            });
        }
        latch.await();

        // then
        assertThat(discussionRepository.findById(discussion.getId()))
                .get()
                .extracting("participantCount")
                .isEqualTo(6);
    }

    @Test
    void 동시에_여러명이_참여를_시도해도_최대_참여_인원을_초과하지_않는다() throws InterruptedException {
        // given
        List<User> users = List.of(
                createUser("email1@gmail.com"), createUser("email2@gmail.com"),
                createUser("email3@gmail.com"), createUser("email4@gmail.com"),
                createUser("email5@gmail.com"), createUser("email6@gmail.com")
        );
        userRepository.saveAll(users);
        Discussion discussion = createDiscussion(createUser("admin@admin.com"),
                5,
                0,
                LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15,0)).plusMinutes(15)
        );

        int threadCount = users.size();
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(threadCount);

        List<Throwable> exceptions = Collections.synchronizedList(new ArrayList<>());

        // when
        for (User user : users) {
            executorService.submit(() -> {
                try {
                    discussionParticipantService.participate(user.getId(), discussion.getId());
                } catch (Throwable e) {
                    exceptions.add(e);
                } finally {
                    latch.countDown();
                }
            });
        }
        latch.await();

        // then
        assertSoftly(softly -> {
            softly.assertThat(discussionRepository.findById(discussion.getId()))
                    .get()
                    .extracting("participantCount")
                    .isEqualTo(5);

            softly.assertThat(exceptions)
                    .hasSize(1);

            softly.assertThat(exceptions.get(0))
                    .isInstanceOf(DialogException.class)
                    .hasMessage(ErrorCode.PARTICIPATION_LIMIT_EXCEEDED.message);
        });

    }


    private User createUser(String email) {
        User user = User.builder()
                .email(email)
                .nickname("test")
                .emailNotification(false)
                .phoneNotification(false)
                .phoneNumber("111-111-1111")
                .build();
        return userRepository.save(user);
    }

    private Discussion createDiscussion(User user,
                                        int maxParticipantCount,
                                        int participantCount,
                                        LocalDateTime startAt) {
        Discussion discussion = Discussion.builder()
                .author(user)
                .category(Category.ANDROID)
                .content("content")
                .startAt(startAt)
                .endAt(LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.of(15,0)).plusMinutes(30))
                .title("title")
                .maxParticipantCount(maxParticipantCount)
                .participantCount(participantCount)
                .place("place")
                .viewCount(3)
                .summary("summary")
                .build();
        return discussionRepository.save(discussion);
    }
}
