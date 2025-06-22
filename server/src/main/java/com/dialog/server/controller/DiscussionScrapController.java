package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.service.ScrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discussions/{discussionId}/scraps")
@RequiredArgsConstructor
public class DiscussionScrapController {

    private final ScrapService scrapService;

    @PostMapping
    public ResponseEntity<Void> scrap(@PathVariable Long discussionId, @AuthenticatedUserId Long userId) {
        scrapService.create(userId, discussionId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteScrap(@PathVariable Long discussionId, @AuthenticatedUserId Long userId) {
        scrapService.delete(userId, discussionId);
        return ResponseEntity.noContent()
                .build();
    }
}
