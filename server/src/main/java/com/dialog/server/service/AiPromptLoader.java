package com.dialog.server.service;

import com.dialog.server.exception.DialogException;
import com.dialog.server.exception.ErrorCode;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class AiPromptLoader {
    public String loadPrompt(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new DialogException(ErrorCode.FAILED_LOAD_PROMPT);
        }
    }
}
