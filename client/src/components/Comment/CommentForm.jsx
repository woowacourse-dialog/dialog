import React, { useState } from 'react';
import MarkdownEditor from '../MarkdownEditor/MarkdownEditor';
import Button from '../ui/Button/Button';
import styles from './CommentForm.module.css';

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
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(content.trim());
      if (!initialContent) setContent('');
    } catch (error) {
      console.error('Failed to save comment:', error);
    }
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setContent(initialContent);
    onCancel?.();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.editorWrapper}>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder={placeholder}
        />
      </div>
      <div className={styles.actions}>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={disabled || isSubmitting}
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || isSubmitting || !content.trim()}
        >
          {isSubmitting ? '작성 중...' : submitText}
        </Button>
      </div>
    </form>
  );
};

export default CommentForm;
