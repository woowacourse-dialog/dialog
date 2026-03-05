package com.dialog.server.dto.request;

import com.dialog.server.domain.ReportReason;
import jakarta.validation.constraints.NotNull;

public record ReportRequest(
        @NotNull ReportReason reason
) {
}