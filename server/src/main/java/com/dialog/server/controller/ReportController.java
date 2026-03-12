package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.request.ReportRequest;
import com.dialog.server.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/discussions/{discussionId}/reports")
    public ResponseEntity<Void> reportDiscussion(
            @PathVariable Long discussionId,
            @AuthenticatedUserId Long userId,
            @RequestBody @Valid ReportRequest request
    ) {
        reportService.reportDiscussion(userId, discussionId, request.reason());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/discussions/{discussionId}/comments/{commentId}/reports")
    public ResponseEntity<Void> reportComment(
            @PathVariable Long discussionId,
            @PathVariable Long commentId,
            @AuthenticatedUserId Long userId,
            @RequestBody @Valid ReportRequest request
    ) {
        reportService.reportComment(userId, commentId, request.reason());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
