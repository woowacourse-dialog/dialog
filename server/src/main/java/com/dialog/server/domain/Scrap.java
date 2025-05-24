package com.dialog.server.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.Objects;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "scraps")
@Entity
public class Scrap {

    @Column(name = "scrap_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne
    @JoinColumn(name = "discussion_id", nullable = false)
    private Discussion discussion;

    @Builder
    private Scrap(Long id, User user, Discussion discussion) {
        this.id = id;
        this.user = user;
        this.discussion = discussion;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Scrap scrap = (Scrap) o;
        return Objects.equals(getId(), scrap.getId()) && Objects.equals(getUser(), scrap.getUser())
                && Objects.equals(getDiscussion(), scrap.getDiscussion());
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(getId());
        result = 31 * result + Objects.hashCode(getUser());
        result = 31 * result + Objects.hashCode(getDiscussion());
        return result;
    }
}
