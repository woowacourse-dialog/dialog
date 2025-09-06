package com.dialog.server.controller;

import com.dialog.server.dto.auth.AuthenticatedUserId;
import com.dialog.server.dto.notification.request.TokenRequest;
import com.dialog.server.dto.notification.resposne.MyTokenResponse;
import com.dialog.server.dto.notification.resposne.TokenCreationResponse;
import com.dialog.server.exception.ApiSuccessResponse;
import com.dialog.server.service.NotificationService;
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
import org.springframework.web.bind.annotation.RestController;

@RequiredArgsConstructor
@RequestMapping("/api/fcm-tokens")
@RestController
public class FirebaseTokenController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiSuccessResponse<List<MyTokenResponse>>> getMyTokens(@AuthenticatedUserId Long userId) {
        final List<MyTokenResponse> tokens = notificationService.getMessagingTokensByUserId(userId);
        return ResponseEntity.ok(new ApiSuccessResponse<>(tokens));
    }

    @PostMapping
    public ResponseEntity<ApiSuccessResponse<TokenCreationResponse>> addToken(@RequestBody TokenRequest tokenRequest, @AuthenticatedUserId Long userId) {
        final TokenCreationResponse response = notificationService.addMessagingToken(userId, tokenRequest.token());
        return ResponseEntity.ok(new ApiSuccessResponse<>(response));
    }

    @DeleteMapping("/{tokenId}")
    public ResponseEntity<Void> expireToken(@PathVariable Long tokenId) {
        notificationService.deleteMessagingToken(tokenId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{tokenId}")
    public ResponseEntity<Void> updateToken(@PathVariable Long tokenId, TokenRequest tokenRequest, @AuthenticatedUserId Long userId) {
        notificationService.updateToken(userId, tokenId, tokenRequest.token());
        return ResponseEntity.ok().build();
    }
}
