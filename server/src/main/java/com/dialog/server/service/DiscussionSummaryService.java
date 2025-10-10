package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.OnlineDiscussion;
import com.dialog.server.domain.User;
import com.dialog.server.dto.response.DiscussionSummaryCreateResponse;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
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
    private final DiscussionCommentService discussionCommentService;
    private final DiscussionService discussionService;
    private String systemPrompt;
    private String userPrompt;

    @PostConstruct
    void init() {
        systemPrompt = aiPromptLoader.loadPrompt(SYSTEM_PROMPT_PATH);
        userPrompt = aiPromptLoader.loadPrompt(USER_PROMPT_PATH);
    }

    public DiscussionSummaryCreateResponse generateAndUpdateSummaryBy(Long discussionId, Long userId) {
        Discussion discussion = discussionService.getDiscussionEntityById(discussionId);

        User author = discussion.getAuthor();
        if (author.isNotSameId(userId)) {
            throw new DialogException(ErrorCode.UNAUTHORIZED_DISCUSSION_SUMMARY);
        }

        Discussion updatedDiscussion = generateAndUpdateSummary(discussion);
        return DiscussionSummaryCreateResponse.of(updatedDiscussion);
    }

    public void generateAndUpdateSummaryBy(Discussion discussion) {
        generateAndUpdateSummary(discussion);
    }

    private Discussion generateAndUpdateSummary(Discussion discussion) {
        if (discussion.hasSummary()) {
            throw new DialogException(ErrorCode.ALREADY_DISCUSSION_SUMMARY);
        }

        if (discussion instanceof OnlineDiscussion onlineDiscussion) {
            String summary = generateSummary(onlineDiscussion);
            discussionService.updateSummary(onlineDiscussion, summary);
            return discussion;
        }
        throw new DialogException(ErrorCode.CANNOT_SUMMARIZE_OFFLINE_DISCUSSION);
    }

    private String generateSummary(Discussion discussion) {
        Map<String, String> promptContents = getPromptContents(discussion);
        return aiClient.execute(
                systemPrompt,
                userPrompt,
                promptContents
        );
    }

    private Map<String, String> getPromptContents(Discussion discussion) {
        Map<DiscussionComment, List<DiscussionComment>> discussionCommentAndReply =
                discussionCommentService.getDiscussionCommentAndReply(discussion);

        Map<String, String> promptContents = new HashMap<>();
        String content = parseToPromptContent(discussion, discussionCommentAndReply);
        promptContents.put(COMMENT_REPLY_CONTENT_KEY, content);
        return promptContents;
    }

    private String parseToPromptContent(Discussion discussion,
                                        Map<DiscussionComment, List<DiscussionComment>> commentsAndReply) {
        StringBuilder contentBuilder = new StringBuilder();
        contentBuilder.append("[토론 본문]\n");
        contentBuilder.append("작성자: ").append(discussion.getAuthor().getNickname()).append("\n");
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
