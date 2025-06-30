package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.request.ScrapCursorPageRequest;
import com.dialog.server.dto.response.DiscussionPreviewResponse;
import com.dialog.server.dto.response.ScrapCursorPageResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.ScrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class DiscussionScrapController {

    private final ScrapService scrapService;

    @PostMapping("/discussions/{discussionId}/scraps")
    public ResponseEntity<Void> scrap(@PathVariable Long discussionId, @AuthenticatedUserId Long userId) {
        scrapService.create(userId, discussionId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .build();
    }

    @DeleteMapping("/discussions/{discussionId}/scraps")
    public ResponseEntity<Void> deleteScrap(@PathVariable Long discussionId, @AuthenticatedUserId Long userId) {
        scrapService.delete(userId, discussionId);
        return ResponseEntity.noContent()
                .build();
    }

    @GetMapping("scraps/me")
    public ResponseEntity<ApiSuccessResponse<ScrapCursorPageResponse<DiscussionPreviewResponse>>> getScraps(
            @RequestParam(required = false) Long lastCursorId,
            @RequestParam(defaultValue = "10") Integer size,
            @AuthenticatedUserId Long userId) {
        ScrapCursorPageRequest scrapCursorPageRequest = new ScrapCursorPageRequest(lastCursorId, size);
        ScrapCursorPageResponse<DiscussionPreviewResponse> scrapedDiscussions = scrapService.getScrapedDiscussions(
                scrapCursorPageRequest, userId
        );
        return ResponseEntity.ok(new ApiSuccessResponse<>(scrapedDiscussions));
    }
}
