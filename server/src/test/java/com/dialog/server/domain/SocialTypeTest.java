package com.dialog.server.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SocialTypeTest {

    @Test
    @DisplayName("SocialType에 GITHUB, APPLE 값이 존재한다")
    void socialTypeValues() {
        assertThat(SocialType.values()).containsExactly(SocialType.GITHUB, SocialType.APPLE);
    }
}
