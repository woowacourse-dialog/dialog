package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.comment.request.DiscussionCommentCreateRequest;
import com.dialog.server.dto.comment.request.DiscussionCommentUpdateRequest;
import com.dialog.server.dto.comment.response.DiscussionCommentCreateResponse;
import com.dialog.server.dto.comment.response.DiscussionCommentListResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.DiscussionCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/discussions")
public class DiscussionCommentController {

    private final DiscussionCommentService discussionCommentService;

    @PostMapping("/comments")
    public ResponseEntity<ApiSuccessResponse<DiscussionCommentCreateResponse>> createComment(
            @RequestBody @Valid DiscussionCommentCreateRequest request,
            @AuthenticatedUserId Long userId) {

        DiscussionCommentCreateResponse response = discussionCommentService.createComment(request, userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @PatchMapping("/comments/{discussionCommentId}")
    public ResponseEntity<ApiSuccessResponse<Void>> updateComment(
            @PathVariable Long discussionCommentId,
            @RequestBody @Valid DiscussionCommentUpdateRequest request,
            @AuthenticatedUserId Long userId) {

        discussionCommentService.updateComment(discussionCommentId, userId, request.content());
        return ResponseEntity.ok(new ApiSuccessResponse<>(null));
    }

    @DeleteMapping("/comments/{discussionCommentId}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteComment(
            @PathVariable Long discussionCommentId,
            @AuthenticatedUserId Long userId) {

        discussionCommentService.deleteComment(discussionCommentId, userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(null));
    }

    @GetMapping("/{discussionId}/comments")
    public ResponseEntity<ApiSuccessResponse<DiscussionCommentListResponse>> getComments(
            @PathVariable Long discussionId
    ) {
        DiscussionCommentListResponse response = discussionCommentService.getCommentsByDiscussionId(discussionId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }
}
