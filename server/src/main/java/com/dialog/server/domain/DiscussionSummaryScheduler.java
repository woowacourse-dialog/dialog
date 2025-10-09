package com.dialog.server.domain;

import com.dialog.server.exception.DialogException;
import com.dialog.server.service.DiscussionService;
import com.dialog.server.service.DiscussionSummaryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
class DiscussionSummaryScheduler {

    private final DiscussionService discussionService;
    private final DiscussionSummaryService discussionSummaryService;

    @Scheduled(cron = "0 0 0 * * *")
    public void generateSummariesForEndedDiscussions() {
        List<OnlineDiscussion> onlineDiscussions = discussionService.getEndedAndBlankSummaryOnlineDiscussions();

        log.info("종료된 온라인 토론 {}개에 대한 요약 생성 시작", onlineDiscussions.size());

        for (OnlineDiscussion onlineDiscussion : onlineDiscussions) {
            try {
                discussionSummaryService.generateAndUpdateSummary(onlineDiscussion);
            } catch (DialogException e) {
                log.error("토론 ID {}에 대한 요약 생성/업데이트 실패: {}", onlineDiscussion.getId(), e.getMessage());
            }
        }

    }
}
