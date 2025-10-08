package com.dialog.server.service;

import com.dialog.server.domain.Discussion;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import com.dialog.server.repository.DiscussionCommentRepository;
import com.dialog.server.repository.DiscussionRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DiscussionSummaryService {

    private static final String SYSTEM_PROMPT_PATH = "prompts/discussion-summary-system.st";
    private static final String USER_PROMPT_PATH = "prompts/discussion-summary.st";
    private final ChatClient chatClient;
    private final DiscussionRepository discussionRepository;
    private final DiscussionCommentRepository discussionCommentRepository;

    private static String parseToPromptContent(Discussion discussion,
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

    public String generateSummaryByDiscussionId(Long discussionId) {

        Discussion discussion = getDiscussion(discussionId);

        String summary;
        if (!(summary = discussion.getSummary()).isBlank()) {
            return summary;
        }

        Map<DiscussionComment, List<DiscussionComment>> commentsAndReply = getDiscussionCommentAndReply(
                discussion);

        String content = parseToPromptContent(discussion, commentsAndReply);

        summary = getAiSummary(content);

        return summary;
    }

    private Discussion getDiscussion(Long discussionId) {
        return discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));
    }

    private Map<DiscussionComment, List<DiscussionComment>> getDiscussionCommentAndReply(Discussion discussion) {
        List<DiscussionComment> allComments = discussionCommentRepository.findByDiscussion(discussion);

        return allComments.stream()
                .filter(comment -> !comment.hasParent())
                .collect(Collectors.toMap(
                        comment -> comment,
                        discussionCommentRepository::findByParentDiscussionComment
                ));
    }

    private String getAiSummary(String content) {
        try {
            String systemPrompt = loadPrompt(SYSTEM_PROMPT_PATH);
            String userPrompt = loadPrompt(USER_PROMPT_PATH);

            return chatClient.prompt()
                    .system(systemPrompt)
                    .user(userSpec -> userSpec
                            .text(userPrompt)
                            .param("content", content)
                    )
                    .call()
                    .content();
        } catch (IOException e) {
            log.error("Failed to load prompt file", e);
            throw new DialogException(ErrorCode.FAIL_LOAD_PROMPT);
        }
    }

    private String loadPrompt(String path) throws IOException {
        ClassPathResource resource = new ClassPathResource(path);
        return resource.getContentAsString(StandardCharsets.UTF_8);
    }
}
