package com.dialog.server.dto.response;

import com.dialog.server.domain.Track;
import com.dialog.server.domain.User;

public record MyTrackGetTrackResponse(Track track) {
    public static MyTrackGetTrackResponse from(User user) {
        return new MyTrackGetTrackResponse(
                user.getTrack()
        );
    }
}
