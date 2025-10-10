package com.dialog.server.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.dialog.server.domain.OnlineDiscussion;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * DiscussionSummaryScheduler 단위 테스트
 * <p>
 * 스케줄러 테스트 전략: 1. @Scheduled 어노테이션의 실제 실행은 테스트하지 않음 (통합 테스트 영역) 2. 스케줄러 메서드의 비즈니스 로직만 단위 테스트 3. Mock을 사용하여 의존성 격리
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DiscussionSummaryScheduler 단위 테스트")
class DiscussionSummarySchedulerTest {

    @Mock
    private DiscussionService discussionService;

    @Mock
    private DiscussionSummaryService discussionSummaryService;

    @InjectMocks
    private DiscussionSummaryScheduler discussionSummaryScheduler;

    private OnlineDiscussion onlineDiscussion1;
    private OnlineDiscussion onlineDiscussion2;
    private OnlineDiscussion onlineDiscussion3;

    @BeforeEach
    void setUp() {
        onlineDiscussion1 = mock(OnlineDiscussion.class);
        onlineDiscussion2 = mock(OnlineDiscussion.class);
        onlineDiscussion3 = mock(OnlineDiscussion.class);
    }

    @Test
    @DisplayName("요약이 필요한 토론이 없을 때 아무 작업도 수행하지 않는다")
    void generateSummariesForEndedDiscussions_NoDiscussions() {
        // given
        when(discussionService.getEndedAndBlankSummaryOnlineDiscussions())
                .thenReturn(Collections.emptyList());

        // when
        discussionSummaryScheduler.generateSummariesForEndedDiscussions();

        // then
        verify(discussionService, times(1)).getEndedAndBlankSummaryOnlineDiscussions();
        verify(discussionSummaryService, never()).generateAndUpdateSummaryBy(any(OnlineDiscussion.class));
    }

    @Test
    @DisplayName("요약이 필요한 토론이 1개일 때 정상적으로 요약을 생성한다")
    void generateSummariesForEndedDiscussions_SingleDiscussion() {
        // given
        List<OnlineDiscussion> discussions = List.of(onlineDiscussion1);
        when(discussionService.getEndedAndBlankSummaryOnlineDiscussions())
                .thenReturn(discussions);
        doNothing().when(discussionSummaryService).generateAndUpdateSummaryBy(onlineDiscussion1);

        // when
        discussionSummaryScheduler.generateSummariesForEndedDiscussions();

        // then
        verify(discussionService, times(1)).getEndedAndBlankSummaryOnlineDiscussions();
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion1);
    }

    @Test
    @DisplayName("요약이 필요한 토론이 여러 개일 때 모두 요약을 생성한다")
    void generateSummariesForEndedDiscussions_MultipleDiscussions() {
        // given
        List<OnlineDiscussion> discussions = Arrays.asList(
                onlineDiscussion1,
                onlineDiscussion2,
                onlineDiscussion3
        );
        when(discussionService.getEndedAndBlankSummaryOnlineDiscussions())
                .thenReturn(discussions);
        doNothing().when(discussionSummaryService).generateAndUpdateSummaryBy(any(OnlineDiscussion.class));

        // when
        discussionSummaryScheduler.generateSummariesForEndedDiscussions();

        // then
        verify(discussionService, times(1)).getEndedAndBlankSummaryOnlineDiscussions();
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion1);
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion2);
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion3);
    }

    @Test
    @DisplayName("일부 토론의 요약 생성이 실패해도 나머지 토론의 요약은 계속 생성한다")
    void generateSummariesForEndedDiscussions_PartialFailure() {
        // given
        List<OnlineDiscussion> discussions = Arrays.asList(
                onlineDiscussion1,
                onlineDiscussion2,
                onlineDiscussion3
        );
        when(discussionService.getEndedAndBlankSummaryOnlineDiscussions())
                .thenReturn(discussions);

        // 두 번째 토론에서 예외 발생
        doNothing().when(discussionSummaryService).generateAndUpdateSummaryBy(onlineDiscussion1);
        doThrow(new DialogException(ErrorCode.FAILED_AI_SUMMARY))
                .when(discussionSummaryService).generateAndUpdateSummaryBy(onlineDiscussion2);
        doNothing().when(discussionSummaryService).generateAndUpdateSummaryBy(onlineDiscussion3);

        // when
        discussionSummaryScheduler.generateSummariesForEndedDiscussions();

        // then
        verify(discussionService, times(1)).getEndedAndBlankSummaryOnlineDiscussions();
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion1);
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion2);
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion3);
    }

    @Test
    @DisplayName("모든 토론의 요약 생성이 실패해도 예외가 전파되지 않는다")
    void generateSummariesForEndedDiscussions_AllFailures() {
        // given
        List<OnlineDiscussion> discussions = Arrays.asList(
                onlineDiscussion1,
                onlineDiscussion2,
                onlineDiscussion3
        );
        when(discussionService.getEndedAndBlankSummaryOnlineDiscussions())
                .thenReturn(discussions);

        // 모든 토론에서 예외 발생
        doThrow(new DialogException(ErrorCode.FAILED_AI_SUMMARY))
                .when(discussionSummaryService).generateAndUpdateSummaryBy(any(OnlineDiscussion.class));

        // when
        discussionSummaryScheduler.generateSummariesForEndedDiscussions();

        // then
        verify(discussionService, times(1)).getEndedAndBlankSummaryOnlineDiscussions();
        verify(discussionSummaryService, times(3)).generateAndUpdateSummaryBy(any(OnlineDiscussion.class));
    }

    @Test
    @DisplayName("다양한 예외 타입이 발생해도 모두 처리된다")
    void generateSummariesForEndedDiscussions_DifferentExceptionTypes() {
        // given
        List<OnlineDiscussion> discussions = Arrays.asList(
                onlineDiscussion1,
                onlineDiscussion2,
                onlineDiscussion3
        );
        when(discussionService.getEndedAndBlankSummaryOnlineDiscussions())
                .thenReturn(discussions);

        doThrow(new DialogException(ErrorCode.FAILED_AI_SUMMARY))
                .when(discussionSummaryService).generateAndUpdateSummaryBy(onlineDiscussion1);
        doThrow(new DialogException(ErrorCode.NOT_FOUND_DISCUSSION))
                .when(discussionSummaryService).generateAndUpdateSummaryBy(onlineDiscussion2);
        doNothing().when(discussionSummaryService).generateAndUpdateSummaryBy(onlineDiscussion3);

        // when
        discussionSummaryScheduler.generateSummariesForEndedDiscussions();

        // then
        verify(discussionService, times(1)).getEndedAndBlankSummaryOnlineDiscussions();
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion1);
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion2);
        verify(discussionSummaryService, times(1)).generateAndUpdateSummaryBy(onlineDiscussion3);
    }
}
