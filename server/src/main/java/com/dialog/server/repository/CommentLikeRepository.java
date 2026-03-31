package com.dialog.server.repository;

import com.dialog.server.domain.CommentLike;
import com.dialog.server.domain.DiscussionComment;
import com.dialog.server.domain.User;
import com.dialog.server.dto.comment.CommentLikeCountDto;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    boolean existsByUserAndComment(User user, DiscussionComment comment);

    void deleteByUserAndComment(User user, DiscussionComment comment);

    @Query("SELECT new com.dialog.server.dto.comment.CommentLikeCountDto(cl.comment.id, COUNT(cl)) " +
           "FROM CommentLike cl WHERE cl.comment.id IN :commentIds GROUP BY cl.comment.id")
    List<CommentLikeCountDto> countByCommentIdIn(@Param("commentIds") List<Long> commentIds);

    @Query("SELECT cl.comment.id FROM CommentLike cl WHERE cl.user = :user AND cl.comment.id IN :commentIds")
    List<Long> findLikedCommentIdsByUserAndCommentIdIn(@Param("user") User user, @Param("commentIds") List<Long> commentIds);
}
