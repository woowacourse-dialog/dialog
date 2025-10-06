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

    public String generateSummaryByDiscussionId(Long discussionId) {

        // Discussion Id를 이용해서 Discussion 본문을 가져온다.
        Discussion discussion = discussionRepository.findById(discussionId)
                .orElseThrow(() -> new DialogException(ErrorCode.NOT_FOUND_DISCUSSION));

        // 이미 요약된 내용이 존재하는 경우 요약된 내용을 반환한다.
        String summary;
        if (!(summary = discussion.getSummary()).isBlank()) {
            return summary;
        }

        // Discussion Id를 이용해서 댓글 - 작성자 - 내용을 가져온다.
        List<DiscussionComment> allComments = discussionCommentRepository.findByDiscussion(discussion);

        // 최상위 댓글만 필터링 (parentDiscussionComment가 null인 것들)
        Map<DiscussionComment, List<DiscussionComment>> commentsAndReply = allComments.stream()
                .filter(comment -> !comment.hasParent())
                .collect(Collectors.toMap(
                        comment -> comment,
                        discussionCommentRepository::findByParentDiscussionComment
                ));

        // 해당 내용을 프롬프트에 입력하기 위한 폼으로 변경한다.
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

        String content = contentBuilder.toString();

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
