package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.DiscussionWithComment;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class DiscussionSummaryService {

    private static final String SYSTEM_PROMPT_PATH = "prompts/discussion-summary-system.st";
    private static final String USER_PROMPT_PATH = "prompts/discussion-summary.st";
    private static final String COMMENT_REPLY_CONTENT_KEY = "content";
    private final AiClient aiClient;
    private final AiPromptLoader aiPromptLoader;
    private final DiscussionService discussionService;
    private String systemPrompt;
    private String userPrompt;

    @PostConstruct
    void init() {
        systemPrompt = aiPromptLoader.loadPrompt(SYSTEM_PROMPT_PATH);
        userPrompt = aiPromptLoader.loadPrompt(USER_PROMPT_PATH);
    }

    public String generateSummaryByDiscussionId(Long discussionId) {
        // Todo: Discussion & DiscussionComment & Reply 모두 한번에 조회 가능한 서비스가 필요함.. 일단 DiscussionService에서 처리했음.. 그래서 반환 타입이나 로직이 지저분함
        DiscussionWithComment discussionWithComment = discussionService.getDiscussionWithComment(discussionId);

        if (discussionWithComment.hasSummary()) {
            return discussionWithComment.getSummary();
        }

        Map<String, String> promptContents = new HashMap<>();
        String content = parseToPromptContent(discussionWithComment.discussion(),
                discussionWithComment.commentAndReply());
        promptContents.put(COMMENT_REPLY_CONTENT_KEY, content);

        return aiClient.execute(
                systemPrompt,
                userPrompt,
                promptContents
        );
    }

    private String parseToPromptContent(Discussion discussion,
                                        Map<DiscussionComment, List<DiscussionComment>> commentsAndReply) {
        StringBuilder contentBuilder = new StringBuilder();
        contentBuilder.append("[토론 본문]\n");
        contentBuilder.append("제목: ").append(discussion.getTitle()).append("\n");
        contentBuilder.append("내용: ").append(discussion.getContent()).append("\n\n");
        contentBuilder.append("[댓글 및 답글]\n");

        commentsAndReply.forEach((comment, replies) -> {
            contentBuilder.append("- ").append(comment.getAuthor().getNickname())
                    .append(": ").append(comment.getContent()).append("\n");

            replies.forEach(reply -> {
                contentBuilder.append("  └ ").append(reply.getAuthor().getNickname())
                        .append(": ").append(reply.getContent()).append("\n");
            });
        });
        return contentBuilder.toString();
    }
}
