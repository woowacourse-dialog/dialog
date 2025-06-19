package com.dialog.server.controller;

import com.dialog.server.dto.request.DiscussionCreateRequest;
import com.dialog.server.dto.request.DiscussionCursorPageRequest;
import com.dialog.server.dto.request.DiscussionUpdateRequest;
import com.dialog.server.dto.request.SearchType;
import com.dialog.server.dto.response.*;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.DiscussionService;
import jakarta.validation.Valid;
import java.net.URI;
import java.security.Principal;

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

    @PostMapping
    public ResponseEntity<ApiSuccessResponse<DiscussionCreateResponse>> postDiscussion(@RequestBody @Valid DiscussionCreateRequest request, Principal principal) {
        // todo 인증 구현 끝나면 인증 정보에서 유저 정보 추출해서 사용
        String oauthId = principal.getName();
        DiscussionCreateResponse response = discussionService.createDiscussion(request, oauthId);
        return ResponseEntity.created(URI.create("/api/discussions/" + response.discussionId()))
                .body(new ApiSuccessResponse<>(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiSuccessResponse<DiscussionDetailResponse>> getDiscussion(@PathVariable Long id) {
        // todo 토론 상세 페이지에서 작성자가 누구인지 알려주는 응답 생성
        DiscussionDetailResponse response = discussionService.getDiscussionById(id);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(response));
    }

    @GetMapping
    public ResponseEntity<ApiSuccessResponse<DiscussionCursorPageResponse<DiscussionPreviewResponse>>> getDiscussionsWithCursor(
            @RequestParam(required = false) String cursor,
            @RequestParam int size
    ) {
        DiscussionCursorPageRequest request = new DiscussionCursorPageRequest(cursor, size);
        DiscussionCursorPageResponse<DiscussionPreviewResponse> pageDiscussions = discussionService.getDiscussionsPage(request);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(pageDiscussions));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiSuccessResponse<DiscussionCursorPageResponse<DiscussionPreviewResponse>>> searchDiscussions(
            @RequestParam int searchBy,
            @RequestParam String query,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false, defaultValue = "10") int size
    ) {
        final DiscussionCursorPageResponse<DiscussionPreviewResponse> searched = discussionService.searchDiscussion(
                SearchType.fromValue(searchBy), query, cursor, size
        );
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(searched));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiSuccessResponse<Void>> updateDiscussion(@PathVariable Long id, DiscussionUpdateRequest request) {
        discussionService.updateDiscussion(id, request);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiSuccessResponse<Void>> deleteDiscussion(@PathVariable Long id) {
        discussionService.deleteDiscussion(id);
        return ResponseEntity.ok().body(new ApiSuccessResponse<>(null));
    }
}
