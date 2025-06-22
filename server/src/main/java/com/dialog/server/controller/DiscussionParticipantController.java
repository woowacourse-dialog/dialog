package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.service.DiscussionParticipantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discussions/{discussionId}/participants")
@RequiredArgsConstructor
public class DiscussionParticipantController {

    private final DiscussionParticipantService discussionParticipantService;

    @PostMapping
    public ResponseEntity<Void> participate(@PathVariable("discussionId") Long discussionId, @AuthenticatedUserId Long userId) {
        discussionParticipantService.participate(userId, discussionId);
        return ResponseEntity.ok().build();
    }
}
