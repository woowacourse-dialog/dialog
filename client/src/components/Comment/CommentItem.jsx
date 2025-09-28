import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CommentForm from './CommentForm';
import { updateComment, deleteComment } from '../../api/discussion';
import useMe from '../../hooks/useMe';
import './CommentItem.css';

const getAuthorProfileImageSrc = (author) => {
  if (!author || !author.profileImage) return '/src/assets/dialog_icon.png';
  const { basicImageUri, customImageUri } = author.profileImage;
  if (customImageUri) {
    return customImageUri;
  }
  if (basicImageUri) {
    return basicImageUri;
  }
  return '/src/assets/dialog_icon.png';
};

const formatDateTime = (dateTimeStr) => {
  const date = new Date(dateTimeStr);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
};

const CommentItem = ({
  comment,
  onReply,
  onUpdate,
  onDelete,
  depth = 0,
  discussionId
}) => {
  const { me } = useMe();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = me && me.id === comment.author.authorId;
  const hasReplies = comment.childComments && comment.childComments.length > 0;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async (content) => {
    setIsUpdating(true);
    try {
      await updateComment(comment.discussionCommentId, { content });
      setIsEditing(false);
      onUpdate && onUpdate();
    } catch (error) {
      console.error('Failed to update comment:', error);
      alert(error.response?.data?.message || '댓글 수정에 실패했습니다.');
    }
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      await deleteComment(comment.discussionCommentId);
      onDelete && onDelete();
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert(error.response?.data?.message || '댓글 삭제에 실패했습니다.');
    }
    setIsDeleting(false);
  };

  const handleReply = () => {
    setIsReplying(true);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
  };

  const handleSaveReply = async (content) => {
    try {
      await onReply(content, comment.discussionCommentId);
      setIsReplying(false);
    } catch (error) {
      console.error('Failed to create reply:', error);
      alert(error.response?.data?.message || '답글 작성에 실패했습니다.');
    }
  };

  return (
    <div className={`comment-item ${depth > 0 ? 'comment-reply' : ''}`}>
      <div className="comment-content">
        <div className="comment-header">
          <div className="comment-author">
            <img
              src={getAuthorProfileImageSrc(comment.author)}
              alt={comment.author.nickname}
              className="author-avatar"
            />
            <span className="author-name">{comment.author.nickname}</span>
            <span className="comment-date">{formatDateTime(comment.createdAt)}</span>
            {comment.createdAt !== comment.modifiedAt && (
              <span className="comment-modified">(수정됨)</span>
            )}
          </div>
          {isAuthor && (
            <div className="comment-owner-actions">
              <button
                className="edit-button"
                onClick={handleEdit}
                disabled={isEditing || isUpdating}
              >
                수정
              </button>
              <span className="edit-button-separator">
                |
              </span>
              <button
                className="delete-button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
        </div>

        <div className="comment-body">
          {isEditing ? (
            <CommentForm
              initialContent={comment.content}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              submitText={isUpdating ? '수정 중...' : '수정'}
              disabled={isUpdating}
            />
          ) : (
            <div className="comment-text">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({node, inline, className, children, ...props}) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {comment.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isEditing && depth === 0 && (
          <div className="comment-footer">
            {me && (
              <button
                className="reply-button"
                onClick={handleReply}
                disabled={isReplying}
              >
                답글쓰기
              </button>
            )}
          </div>
        )}

        {isReplying && (
          <div className="reply-form">
            <CommentForm
              onSave={handleSaveReply}
              onCancel={handleCancelReply}
              submitText="답글 등록"
              placeholder="답글을 작성해주세요..."
            />
          </div>
        )}
      </div>

      {hasReplies && (
        <div className="comment-replies">
          {comment.childComments.map(reply => (
            <CommentItem
              key={reply.discussionCommentId}
              comment={reply}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
              discussionId={discussionId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
