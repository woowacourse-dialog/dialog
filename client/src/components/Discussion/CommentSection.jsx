import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import CommentItem from './CommentItem';
import CommentForm from '../Comment/CommentForm';
import Button from '../ui/Button/Button';
import { getComments, createComment } from '../../api/discussion';
import { useAuth } from '../../context/AuthContext';
import styles from './CommentSection.module.css';

const CommentSection = ({ discussionId }) => {
  const { currentUser: me } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();
  const scrolledRef = useRef(false);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        setError(null);
        const commentsData = await getComments(discussionId);
        setComments(commentsData || []);
      } catch (err) {
        console.error('Failed to fetch comments:', err);
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

  useEffect(() => {
    if (!loading && location.hash && scrolledRef.current !== location.hash) {
      const elementId = location.hash.substring(1);

      const scrollToElement = () => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.style.transition = 'background-color 0.5s ease';
          element.style.backgroundColor = 'var(--color-accent-subtle, #e8f4ff)';
          setTimeout(() => {
            element.style.backgroundColor = '';
          }, 2000);
          scrolledRef.current = location.hash;
          return true;
        }
        return false;
      };

      if (!scrollToElement()) {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (scrollToElement() || attempts >= 10) {
            clearInterval(interval);
          }
        }, 200);
      }
    }
  }, [loading, location.hash]);

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);

  const handleCreateComment = async (content, parentDiscussionCommentId = null) => {
    try {
      await createComment({
        content,
        discussionId: parseInt(discussionId),
        parentDiscussionCommentId,
      });
      handleRefresh();
    } catch (err) {
      console.error('Failed to create comment:', err);
      throw err;
    }
  };

  const commentCount = comments.reduce(
    (total, c) => total + 1 + (c.childComments?.length || 0),
    0
  );

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.header}>
          <h3>댓글</h3>
        </div>
        <div className={styles.loading}>댓글을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.header}>
          <h3>댓글</h3>
        </div>
        <div className={styles.error}>
          {error}
          <Button variant="primary" size="sm" onClick={handleRefresh}>
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3>댓글 {commentCount}개</h3>
      </div>

      {me ? (
        <div className={styles.formSection}>
          <CommentForm
            onSave={(content) => handleCreateComment(content)}
            submitText="댓글 등록"
            placeholder="댓글을 작성해주세요..."
          />
        </div>
      ) : (
        <div className={styles.loginRequired}>
          댓글을 작성하려면 로그인이 필요합니다.
        </div>
      )}

      <div className={styles.list}>
        {comments.length === 0 ? (
          <div className={styles.empty}>
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

export default CommentSection;
