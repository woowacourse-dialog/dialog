package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.service.LikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/discussions/{discussionsId}/likes")
@RequiredArgsConstructor
public class DiscussionLikeController {

    private final LikeService likeService;

    @PostMapping
    public ResponseEntity<Void> likeDiscussion(@PathVariable("discussionsId") Long discussionsId, @AuthenticatedUserId Long userId) {
        likeService.create(userId, discussionsId);
        return ResponseEntity.ok()
                .build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteLikeDiscussion(@PathVariable("discussionsId") Long discussionsId, @AuthenticatedUserId Long userId) {
        likeService.delete(userId, discussionsId);
        return ResponseEntity.noContent()
                .build();
    }
}
