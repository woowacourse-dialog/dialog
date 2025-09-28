import React, { useState, useEffect } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { getComments, createComment } from '../../api/discussion';
import useMe from '../../hooks/useMe';
import './CommentList.css';

const CommentList = ({ discussionId }) => {
  const { me } = useMe();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const commentsData = await getComments(discussionId);
        setComments(commentsData || []);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        setError('댓글을 불러오는데 실패했습니다.');
        setComments([]);
      } finally {
        setLoading(false);
      }
    };

    if (discussionId) {
      fetchComments();
    }
  }, [discussionId, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCreateComment = async (content, parentDiscussionCommentId = null) => {
    try {
      await createComment({
        content,
        discussionId: parseInt(discussionId),
        parentDiscussionCommentId
      });
      handleRefresh();
    } catch (error) {
      console.error('Failed to create comment:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="comments-section">
        <div className="comments-header">
          <h3>댓글</h3>
        </div>
        <div className="comments-loading">댓글을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comments-section">
        <div className="comments-header">
          <h3>댓글</h3>
        </div>
        <div className="comments-error">
          {error}
          <button onClick={handleRefresh} className="retry-button">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <div className="comments-header">
        <h3>댓글 {comments.length}개</h3>
      </div>

      {me && (
        <div className="comment-form-section">
          <CommentForm
            onSave={(content) => handleCreateComment(content)}
            submitText="댓글 등록"
            placeholder="댓글을 작성해주세요..."
          />
        </div>
      )}

      {!me && (
        <div className="login-required">
          댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}

      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map(comment => (
            <CommentItem
              key={comment.discussionCommentId}
              comment={comment}
              onReply={handleCreateComment}
              onUpdate={handleRefresh}
              onDelete={handleRefresh}
              discussionId={discussionId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentList;
