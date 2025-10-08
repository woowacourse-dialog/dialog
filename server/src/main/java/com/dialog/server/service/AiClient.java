package com.dialog.server.service;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiClient {

    private final ChatClient chatClient;

    public String execute(String systemPrompt, String userPrompt, Map<String, String> params) {
        try {
            return chatClient.prompt()
                    .system(systemPrompt)
                    .user(userSpec -> {
                                userSpec.text(userPrompt);
                                params.forEach(userSpec::param);
                            }
                    )
                    .call()
                    .content();
        } catch (Exception e) {
            // TODO 추후 재시도 로직 등 예외 상황에 따른 추가 행위가 필요할 때 상세 예외처리 진행
            log.error(e.getMessage());
            throw new DialogException(ErrorCode.FAILED_AI_SUMMARY);
        }
    }
}
