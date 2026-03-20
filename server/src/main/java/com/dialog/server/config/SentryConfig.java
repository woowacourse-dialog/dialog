package com.dialog.server.config;

import io.sentry.SentryEvent;
import io.sentry.SentryOptions;
import io.sentry.protocol.User;
import io.sentry.spring.jakarta.SentryTaskDecorator;
import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.TaskDecorator;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

@Configuration
@ConditionalOnProperty(name = "sentry.dsn", matchIfMissing = false)
public class SentryConfig {

    @Bean
    public SentryOptions.BeforeSendCallback beforeSendCallback() {
        return (event, hint) -> {
            attachTraceId(event);
            attachUserContext(event);

            if (isClientDisconnect(event)) {
                return null;
            }

            return event;
        };
    }

    @Bean
    public TaskDecorator sentryTaskDecorator() {
        return new SentryTaskDecorator();
    }

    private void attachTraceId(SentryEvent event) {
        String traceId = MDC.get("traceId");
        if (traceId != null) {
            event.setTag("traceId", traceId);
        }
    }

    private void attachUserContext(SentryEvent event) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()
                    && !(auth instanceof AnonymousAuthenticationToken)) {
                User user = new User();
                user.setId(auth.getName());
                event.setUser(user);
            }
        } catch (Exception ignored) {
        }
    }

    private boolean isClientDisconnect(SentryEvent event) {
        if (event.getThrowable() == null) return false;
        String message = event.getThrowable().getMessage();
        if (message == null) return false;
        return message.contains("Broken pipe")
                || message.contains("Connection reset by peer")
                || message.contains("ClientAbortException");
    }
}
