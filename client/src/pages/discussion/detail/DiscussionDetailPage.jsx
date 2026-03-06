import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiscussionHeader from '../../../components/Discussion/DiscussionHeader';
import DiscussionContent from '../../../components/Discussion/DiscussionContent';
import ActionBar from '../../../components/Discussion/ActionBar';
import AISummary from '../../../components/Discussion/AISummary';
import CommentList from '../../../components/Comment/CommentList';
import ConfirmModal from '../../../components/ui/ConfirmModal/ConfirmModal';
import ReportModal from '../../../components/ui/ReportModal/ReportModal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import {
  findDiscussionById,
  deleteDiscussion,
  isParticipating as checkIsParticipating,
  participateDiscussion,
} from '../../../api/discussion';
import { getLikeStatus } from '../../../api/like';
import { getScrapStatus } from '../../../api/scrap';
import { reportDiscussion } from '../../../api/report';
import { useAuth } from '../../../context/AuthContext';
import styles from './DiscussionDetailPage.module.css';

const DiscussionDetailPage = () => {
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const { id } = useParams();
  const { currentUser: me } = useAuth();

  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [summary, setSummary] = useState('');
  const [isParticipatingState, setIsParticipatingState] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reporting, setReporting] = useState(false);

  // Fetch discussion data
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchDiscussion = async () => {
      try {
        const res = await findDiscussionById(id);
        setDiscussion(res.data);
        setLikeCount(Number(res.data.commonDiscussionInfo?.likeCount) || 0);
        setIsBookmarked(res.data.isBookmarked || false);
        setSummary(res.data.commonDiscussionInfo.summary || '');
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch discussion:', error);
        setLoading(false);
      }
    };

    fetchDiscussion();
  }, [id]);

  // Fetch like/scrap/participation status when logged in
  useEffect(() => {
    if (!me) {
      setIsLiked(false);
      setIsBookmarked(false);
      setIsParticipatingState(false);
      return;
    }

    const fetchStatuses = async () => {
      const [likeResult, scrapResult, participationResult] = await Promise.allSettled([
        getLikeStatus(id),
        getScrapStatus(id),
        checkIsParticipating(id),
      ]);

      setIsLiked(likeResult.status === 'fulfilled' ? likeResult.value.data.isLiked : false);
      setIsBookmarked(scrapResult.status === 'fulfilled' ? scrapResult.value.data.isScraped : false);
      setIsParticipatingState(
        participationResult.status === 'fulfilled'
          ? participationResult.value.data?.isParticipation ?? false
          : false
      );
    };

    fetchStatuses();
  }, [id, me]);

  const handleEdit = () => {
    navigate(`/discussion/${id}/edit`);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleReport = async (reason) => {
    setReporting(true);
    try {
      await reportDiscussion(id, reason);
      alert('신고가 접수되었습니다.');
    } catch (error) {
      const msg = error.response?.data?.message;
      alert(msg || '신고에 실패했습니다.');
    } finally {
      setReporting(false);
      setShowReportModal(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteDiscussion(id);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete discussion:', error);
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleSummaryUpdate = (newSummary) => {
    setSummary(newSummary);
    if (discussion) {
      setDiscussion(prev => ({
        ...prev,
        commonDiscussionInfo: {
          ...prev.commonDiscussionInfo,
          summary: newSummary,
        },
      }));
    }
  };

  const handleParticipate = () => {
    setIsParticipatingState(true);
    // Re-fetch discussion to update participant data
    const refetch = async () => {
      try {
        const res = await findDiscussionById(id);
        setDiscussion(res.data);
      } catch (error) {
        console.error('Failed to refetch discussion:', error);
      }
    };
    refetch();
  };

  const handleJoin = async () => {
    if (discussion.discussionType === 'ONLINE') return;

    try {
      await participateDiscussion(discussion.id);
      handleParticipate();
    } catch (error) {
      console.error('Failed to join discussion:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <LoadingSpinner message="Loading..." fullPage />
        </div>
      </div>
    );
  }

  if (!discussion) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.error}>토론을 찾을 수 없습니다.</div>
        </div>
      </div>
    );
  }

  const isAuthor = me?.id === discussion.commonDiscussionInfo.author.id;
  const isOnline = discussion.discussionType === 'ONLINE';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <DiscussionHeader
            discussion={discussion}
            isAuthor={isAuthor}
            me={me}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onReport={() => setShowReportModal(true)}
            isParticipating={isParticipatingState}
            onJoin={handleJoin}
          />

          <DiscussionContent content={discussion.commonDiscussionInfo.content} />

          {isOnline && (
            <AISummary
              discussionId={id}
              discussion={discussion}
              me={me}
              initialSummary={summary}
              onSummaryUpdate={handleSummaryUpdate}
            />
          )}

          <ActionBar
            discussionId={discussion.id}
            initialLiked={isLiked}
            initialLikeCount={likeCount}
            initialBookmarked={isBookmarked}
            isLoggedIn={!!me}
          />

          <CommentList discussionId={id} />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="토론 삭제"
        message="정말로 이 토론을 삭제하시겠습니까? 삭제된 토론은 복구할 수 없습니다."
        confirmLabel="확인"
        cancelLabel="취소"
        variant="danger"
        loading={deleting}
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

export default DiscussionDetailPage;
