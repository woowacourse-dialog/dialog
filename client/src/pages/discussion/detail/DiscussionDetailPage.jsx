import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DiscussionHeader from '../../../components/Discussion/DiscussionHeader';
import DiscussionContent from '../../../components/Discussion/DiscussionContent';
import ActionBar from '../../../components/Discussion/ActionBar';
import OnlineInfoCard from '../../../components/Discussion/OnlineInfoCard';
import AISummary from '../../../components/Discussion/AISummary';
import CommentList from '../../../components/Comment/CommentList';
import Button from '../../../components/ui/Button/Button';
import ConfirmModal from '../../../components/ui/ConfirmModal/ConfirmModal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner/LoadingSpinner';
import {
  findDiscussionById,
  deleteDiscussion,
  isParticipating as checkIsParticipating,
  participateDiscussion,
} from '../../../api/discussion';
import { getLikeStatus } from '../../../api/like';
import { getScrapStatus } from '../../../api/scrap';
import { formatDiscussionDate, formatTimeOnly } from '../../../utils/dateUtils';
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
      try {
        const likeStatusRes = await getLikeStatus(id);
        setIsLiked(likeStatusRes.data.isLiked);
      } catch {
        setIsLiked(false);
      }

      try {
        const scrapStatusRes = await getScrapStatus(id);
        setIsBookmarked(scrapStatusRes.data.isScraped);
      } catch {
        setIsBookmarked(false);
      }

      try {
        const participationRes = await checkIsParticipating(id);
        setIsParticipatingState(participationRes.data?.isParticipation ?? false);
      } catch {
        setIsParticipatingState(false);
      }
    };

    fetchStatuses();
  }, [id, me]);

  const handleEdit = () => {
    navigate(`/discussion/${id}/edit`);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
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
  const isOffline = discussion.discussionType === 'OFFLINE';
  const isOnline = discussion.discussionType === 'ONLINE';

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <DiscussionHeader discussion={discussion} />

          {isOnline && (
            <OnlineInfoCard endDate={discussion.onlineDiscussionInfo.endDate} />
          )}

          {isOffline && discussion.offlineDiscussionInfo && (
            <OfflineInfoSection
              info={discussion.offlineDiscussionInfo}
              isParticipating={isParticipatingState}
              isAuthor={isAuthor}
              onJoin={handleJoin}
            />
          )}

          <DiscussionContent content={discussion.commonDiscussionInfo.content} />

          <ActionBar
            discussionId={discussion.id}
            initialLiked={isLiked}
            initialLikeCount={likeCount}
            initialBookmarked={isBookmarked}
            isLoggedIn={!!me}
          />

          {isOnline && (
            <AISummary
              discussionId={id}
              discussion={discussion}
              me={me}
              initialSummary={summary}
              onSummaryUpdate={handleSummaryUpdate}
            />
          )}

          {isAuthor && (
            <div className={styles.authorActions}>
              <Button variant="secondary" onClick={handleEdit}>
                수정
              </Button>
              <Button variant="danger" onClick={handleDeleteClick}>
                삭제
              </Button>
            </div>
          )}

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
    </div>
  );
};

// Inline OfflineInfoSection since OfflineInfoCard may not yet exist as a separate component
const OfflineInfoSection = ({ info, isParticipating, isAuthor, onJoin }) => {
  const isFull = info.participantCount >= info.maxParticipantCount;

  const getButtonLabel = () => {
    if (isParticipating) return '참여 완료';
    if (isFull) return '인원 마감';
    return '참여하기';
  };

  return (
    <div className={styles.offlineSection}>
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>장소</span>
          <span className={styles.metaValue}>{info.place}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>일시</span>
          <span className={styles.metaValue}>{formatDiscussionDate(info.startAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>시간</span>
          <span className={styles.metaValue}>
            {formatTimeOnly(info.startAt)} ~ {formatTimeOnly(info.endAt)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>인원</span>
          <span className={styles.metaValue}>
            {info.participantCount}/{info.maxParticipantCount}명
          </span>
        </div>
      </div>

      <div className={styles.participants}>
        <h3 className={styles.participantsTitle}>
          참여자
          <span className={styles.participantCount}>
            {info.participants?.length || 0}/{info.maxParticipantCount}명
          </span>
        </h3>
        <div className={styles.participantsList}>
          {info.participants?.map(p => (
            <span key={p.id} className={styles.participantChip}>{p.name}</span>
          ))}
        </div>
      </div>

      {!isAuthor && (
        <Button
          variant="primary"
          className={styles.joinBtn}
          onClick={onJoin}
          disabled={isParticipating || isFull}
        >
          {getButtonLabel()}
        </Button>
      )}
    </div>
  );
};

export default DiscussionDetailPage;
