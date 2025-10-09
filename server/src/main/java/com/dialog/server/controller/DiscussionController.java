package com.dialog.server.controller;

import com.dialog.server.domain.Category;
import com.dialog.server.domain.DiscussionStatus;
import com.dialog.server.domain.DiscussionType;
import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.request.DiscussionCursorPageRequest;
import com.dialog.server.dto.request.DiscussionSummaryCreateRequest;
import com.dialog.server.dto.request.OfflineDiscussionCreateRequest;
import com.dialog.server.dto.request.OfflineDiscussionUpdateRequest;
import com.dialog.server.dto.request.OnlineDiscussionCreateRequest;
import com.dialog.server.dto.request.OnlineDiscussionUpdateRequest;
import com.dialog.server.dto.request.SearchType;
import com.dialog.server.dto.response.DiscussionCreateResponse;
import com.dialog.server.dto.response.DiscussionCursorPageResponse;
import com.dialog.server.dto.response.DiscussionDetailResponse;
import com.dialog.server.dto.response.DiscussionPreviewResponse;
import com.dialog.server.dto.response.DiscussionSummaryCreateResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.DiscussionService;
import com.dialog.server.service.DiscussionSummaryService;
import com.dialog.server.service.NotificationService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/discussions")
public class DiscussionController {

    private final DiscussionService discussionService;
    private final DiscussionSummaryService discussionSummaryService;
    private final NotificationService notificationService;

    @PostMapping("/offline")
    public ResponseEntity<ApiSuccessResponse<DiscussionCreateResponse>> postOfflineDiscussion(
            @RequestBody @Valid OfflineDiscussionCreateRequest request,
            @AuthenticatedUserId Long userId
    ) {
        DiscussionCreateResponse response = discussionService.createOfflineDiscussion(request, userId);
        final URI uri = URI.create("/api/discussions/" + response.discussionId());
        notificationService.sendDiscussionCreatedNotification(userId, uri.getRawPath());
        return ResponseEntity.created(uri)
                .body(new ApiSuccessResponse<>(response));
    }

    @PostMapping("/online")
    public ResponseEntity<ApiSuccessResponse<DiscussionCreateResponse>> postOfflineDiscussion(
            @RequestBody @Valid OnlineDiscussionCreateRequest request,
            @AuthenticatedUserId Long userId
    ) {
        DiscussionCreateResponse response = discussionService.createOnlineDiscussion(request, userId);
        final URI uri = URI.create("/api/discussions/" + response.discussionId());
        notificationService.sendDiscussionCreatedNotification(userId, uri.getRawPath());
        return ResponseEntity.created(uri)
                .body(new ApiSuccessResponse<>(response));
    }

    @PatchMapping("/offline/{id}")
    public ResponseEntity<ApiSuccessResponse<Void>> updateOfflineDiscussion(
            @PathVariable Long id,
            @Valid @RequestBody OfflineDiscussionUpdateRequest request
    ) {
        discussionService.updateOfflineDiscussion(id, request);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(null));
    }

    @PatchMapping("/online/{id}")
    public ResponseEntity<ApiSuccessResponse<Void>> updateOnlineDiscussion(
            @PathVariable Long id,
            @Valid @RequestBody OnlineDiscussionUpdateRequest request
    ) {
        discussionService.updateOnlineDiscussion(id, request);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteDiscussion(@PathVariable Long id) {
        discussionService.deleteDiscussion(id);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(null));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiSuccessResponse<DiscussionDetailResponse>> getDiscussion(@PathVariable Long id) {
        // todo 토론 상세 페이지에서 작성자가 누구인지 알려주는 응답 생성
        DiscussionDetailResponse response = discussionService.getDiscussionById(id);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(response));
    }

    @GetMapping
    public ResponseEntity<ApiSuccessResponse<DiscussionCursorPageResponse<DiscussionPreviewResponse>>> getDiscussionsWithCursor(
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) List<String> discussionTypes,
            @RequestParam(required = false) String cursor,
            @RequestParam int size
    ) {
        DiscussionCursorPageRequest request = new DiscussionCursorPageRequest(cursor, size);
        DiscussionCursorPageResponse<DiscussionPreviewResponse> pageDiscussions = discussionService.getDiscussionsPage(
                Category.fromValues(categories),
                DiscussionStatus.fromValues(statuses),
                DiscussionType.fromValues(discussionTypes),
                request
        );
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(pageDiscussions));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiSuccessResponse<DiscussionCursorPageResponse<DiscussionPreviewResponse>>> searchDiscussions(
            @RequestParam int searchBy,
            @RequestParam String query,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) List<String> statuses,
            @RequestParam(required = false) List<String> discussionTypes,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false, defaultValue = "10") int size
    ) {
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussionWithFilters(
                SearchType.fromValue(searchBy),
                query,
                Category.fromValues(categories),
                DiscussionStatus.fromValues(statuses),
                DiscussionType.fromValues(discussionTypes),
                cursor,
                size
        );
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(searched));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiSuccessResponse<DiscussionCursorPageResponse<DiscussionPreviewResponse>>> getDiscussionsByLoginUser(
            @RequestParam(required = false) String cursor,
            @RequestParam int size,
            @AuthenticatedUserId Long userId
    ) {
        DiscussionCursorPageRequest request = new DiscussionCursorPageRequest(cursor, size);
        DiscussionCursorPageResponse<DiscussionPreviewResponse> discussionCursorPageResponse = discussionService.getDiscussionByAuthorId(
                request, userId
        );
        return ResponseEntity.ok(new ApiSuccessResponse<>(discussionCursorPageResponse));
    }

    @PostMapping("/summary")
    public ResponseEntity<ApiSuccessResponse<DiscussionSummaryCreateResponse>> postDiscussionSummary(
            @RequestBody @Valid DiscussionSummaryCreateRequest request,
            @AuthenticatedUserId Long userId
    ) {
        DiscussionSummaryCreateResponse discussionSummaryCreateResponse =
                discussionSummaryService.generateAndUpdateSummaryBy(request.discussionId(), userId);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(discussionSummaryCreateResponse));
    }
}
