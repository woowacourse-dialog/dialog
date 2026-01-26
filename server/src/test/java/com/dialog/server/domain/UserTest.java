package com.dialog.server.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.dialog.server.exception.DialogException;
import org.junit.jupiter.api.Test;

class UserTest {

    @Test
    void 사용자는_탈퇴할_수_있다() {
        //given
        User user = User.builder()
                .nickname("사용자")
                .build();

        //when
        user.withdraw();

        //then
        assertThat(user.getDeletedAt()).isNotNull();
    }

    @Test
    void 탈퇴한_사용자는_업데이트를_한다면_예외가_발생한다() {
        //given
        User user = User.builder()
                .nickname("사용자")
                .build();
        user.withdraw();

        //when //then
        assertThatThrownBy(() -> user.updateUser("하이", Track.ANDROID))
                .isInstanceOf(DialogException.class)
                .hasMessage("탈퇴한 사용자입니다.");
    }

    @Test
    void 탈퇴한_사용자는_닉네임_조회시_기존의_닉네임이_아닌_탈퇴전용_닉네임으로_조회된다() {
        //given
        User user = User.builder()
                .nickname("사용자")
                .build();
        user.withdraw();

        //when
        String nickname = user.getNickname();

        //then
        assertThat(nickname).isEqualTo("탈퇴한 사용자");
    }
}
