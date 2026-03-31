import React, { useState, useCallback, useRef } from 'react';
import { Pencil, Trash2, Flag, SmilePlus } from 'lucide-react';
import clsx from 'clsx';
import MarkdownRender from '../Markdown/MarkdownRender';
import CommentForm from './CommentForm';
import Avatar from '../ui/Avatar/Avatar';
import MoreMenu from '../ui/MoreMenu/MoreMenu';
import ConfirmModal from '../ui/ConfirmModal/ConfirmModal';
import ReportModal from '../ui/ReportModal/ReportModal';
import { updateComment, deleteComment } from '../../api/discussion';
import { reportComment } from '../../api/report';
import { likeComment, unlikeComment } from '../../api/commentLike';
import { useAuth } from '../../context/AuthContext';
import useClickOutside from '../../hooks/useClickOutside';
import { formatCommentDate } from '../../utils/dateUtils';
import { getProfileImageSrc } from '../../utils/profileImage';
import styles from './CommentItem.module.css';

const ICON_PENCIL = <Pencil size={16} />;
const ICON_TRASH = <Trash2 size={16} />;
const ICON_FLAG = <Flag size={16} />;

const CommentItem = ({
  comment,
  onReply,
  onUpdate,
  onDelete,
  depth = 0,
  discussionId
}) => {
  const { currentUser: me } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(comment.likeCount ?? 0);
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  useClickOutside(pickerRef, () => setShowPicker(false), showPicker);

  const isAuthor = me && me.id === comment.author.authorId;
  const hasReplies = comment.childComments?.length > 0;

  const handleSaveEdit = async (content) => {
    setIsUpdating(true);
    try {
      await updateComment(comment.discussionCommentId, { content });
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteComment(comment.discussionCommentId);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
    setIsDeleting(false);
    setShowDeleteModal(false);
  };

  const handleReport = async (reason) => {
    setReporting(true);
    try {
      await reportComment(discussionId, comment.discussionCommentId, reason);
      alert('신고가 접수되었습니다.');
    } catch (error) {
      const msg = error.response?.data?.message;
      alert(msg || '신고에 실패했습니다.');
    } finally {
      setReporting(false);
      setShowReportModal(false);
    }
  };

  const buildCommentMenuItems = () => {
    if (isAuthor) {
      return [
        { icon: ICON_PENCIL, label: '수정하기', onClick: () => setIsEditing(true), disabled: isEditing || isUpdating },
        { icon: ICON_TRASH, label: '삭제하기', variant: 'danger', onClick: () => setShowDeleteModal(true), disabled: isDeleting },
      ];
    }
    return [
      { icon: ICON_FLAG, label: '신고하기', variant: 'warning', onClick: () => setShowReportModal(true) },
    ];
  };

  const handleLike = useCallback(async () => {
    if (!me) return;
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!prevLiked);
    setLikeCount(prev => prevLiked ? Math.max(0, prev - 1) : prev + 1);
    try {
      if (prevLiked) {
        await unlikeComment(comment.discussionCommentId);
      } else {
        await likeComment(comment.discussionCommentId);
      }
    } catch (error) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      console.error('Failed to update comment like:', error);
    }
  }, [me, isLiked, likeCount, comment.discussionCommentId]);

  const handleSaveReply = async (content) => {
    await onReply(content, comment.discussionCommentId);
    setIsReplying(false);
  };

  return (
    <div
      id={`comment-${comment.discussionCommentId}`}
      className={clsx(styles.item, depth > 0 && styles.reply)}
    >
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.authorInfo}>
            <Avatar
              src={getProfileImageSrc(comment.author?.profileImage)}
              alt={comment.author.nickname}
              size="sm"
            />
            <span className={styles.authorName}>{comment.author.nickname}</span>
            <span className={styles.date}>{formatCommentDate(comment.createdAt)}</span>
            {comment.createdAt !== comment.modifiedAt && (
              <span className={styles.modified}>(수정됨)</span>
            )}
          </div>
          {me && (
            <MoreMenu items={buildCommentMenuItems()} />
          )}
        </div>

        <div className={styles.body}>
          {isEditing ? (
            <CommentForm
              initialContent={comment.content}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
              submitText={isUpdating ? '수정 중...' : '수정'}
              disabled={isUpdating}
            />
          ) : (
            <div className={styles.text}>
              <MarkdownRender content={comment.content} />
            </div>
          )}
        </div>

        {!isEditing && (
          <div className={styles.footer}>
            {likeCount > 0 && (
              <button
                className={clsx(styles.likeBtn, isLiked && styles.likeBtnActive)}
                onClick={handleLike}
                disabled={!me}
                title={!me ? '로그인 후 이용할 수 있습니다' : undefined}
                aria-label={isLiked ? '따봉 취소' : '따봉'}
              >
                👍 <span className={styles.likeCount}>{likeCount}</span>
              </button>
            )}
            {me && (
              <div className={styles.pickerWrap} ref={pickerRef}>
                <button
                  className={styles.pickerTrigger}
                  onClick={() => setShowPicker(prev => !prev)}
                  aria-label="이모티콘 추가"
                >
                  <SmilePlus size={14} />
                </button>
                {showPicker && (
                  <div className={styles.pickerPopover}>
                    <button
                      className={clsx(styles.emojiOption, isLiked && styles.emojiOptionActive)}
                      onClick={() => { handleLike(); setShowPicker(false); }}
                      aria-label="따봉"
                    >
                      👍
                    </button>
                  </div>
                )}
              </div>
            )}
            {depth === 0 && me && (
              <button
                className={styles.replyBtn}
                onClick={() => setIsReplying(true)}
                disabled={isReplying}
              >
                답글쓰기
              </button>
            )}
          </div>
        )}

        {isReplying && (
          <div className={styles.replyForm}>
            <CommentForm
              onSave={handleSaveReply}
              onCancel={() => setIsReplying(false)}
              submitText="답글 등록"
              placeholder="답글을 작성해주세요..."
            />
          </div>
        )}
      </div>

      {hasReplies && (
        <div className={styles.replies}>
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

      <ConfirmModal
        isOpen={showDeleteModal}
        title="댓글 삭제"
        message="댓글을 삭제하시겠습니까?"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onConfirm={handleReport}
        loading={reporting}
      />
    </div>
  );
};

export default CommentItem;
