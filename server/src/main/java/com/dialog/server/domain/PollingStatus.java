package com.dialog.server.domain;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PollingStatus {
    TIMEOUT,
    NEW_NOTIFICATION,
    ;
}
