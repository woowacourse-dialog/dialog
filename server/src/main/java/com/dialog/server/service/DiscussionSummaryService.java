package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
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
    private final DiscussionCommentService discussionCommentService;
    private String systemPrompt;
    private String userPrompt;

    @PostConstruct
    void init() {
        systemPrompt = aiPromptLoader.loadPrompt(SYSTEM_PROMPT_PATH);
        userPrompt = aiPromptLoader.loadPrompt(USER_PROMPT_PATH);
    }

    public String generateSummaryByDiscussionId(Long discussionId) {

        Discussion discussion = discussionService.getDiscussionEntityById(discussionId);

        String summary;
        if (!(summary = discussion.getSummary()).isBlank()) {
            return summary;
        }

        Map<DiscussionComment, List<DiscussionComment>> commentsAndReply = discussionCommentService.getDiscussionCommentAndReply(
                discussion);

        Map<String, String> promptContents = new HashMap<>();
        String content = parseToPromptContent(discussion, commentsAndReply);
        promptContents.put(COMMENT_REPLY_CONTENT_KEY, content);

        summary = aiClient.execute(
                systemPrompt,
                userPrompt,
                promptContents
        );

        return summary;
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
