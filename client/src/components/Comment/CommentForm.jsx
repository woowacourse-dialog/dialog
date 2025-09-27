import React, { useState } from 'react';
import MarkdownEditor from '../MarkdownEditor/MarkdownEditor';
import './CommentForm.css';

const CommentForm = ({
  initialContent = '',
  onSave,
  onCancel,
  submitText = '작성',
  placeholder = '댓글을 작성해주세요...',
  disabled = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(content.trim());
      if (!initialContent) {
        setContent('');
      }
    } catch (error) {
      console.error('Failed to save comment:', error);
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setContent(initialContent);
    onCancel && onCancel();
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-form-content">
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
        />
      </div>

      <div className="comment-form-actions">
        {onCancel && (
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={disabled || isSubmitting}
          >
            취소
          </button>
        )}
        <button
          type="submit"
          className="submit-button"
          disabled={disabled || isSubmitting || !content.trim()}
        >
          {isSubmitting ? '작성 중...' : submitText}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
