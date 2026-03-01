import React from 'react';
import { useNavigate } from 'react-router-dom';

import commentIcon from '../assets/comment-icon.svg';
import { getDiscussionStatus, getDiscussionStatusStyle } from '../utils/discussionStatus';
import { getTrackDisplayName } from '../constants/tracks';
import { getProfileImageSrc } from '../utils/profileImage';
import styles from './DiscussionCard.module.css';

export default function DiscussionCard({
  id,
  discussionType,
  commonDiscussionInfo,
  offlineDiscussionInfo,
  onlineDiscussionInfo
}) {
  const navigate = useNavigate();

  // 토론 상태 계산
  const discussion = {
    discussionType,
    commonDiscussionInfo,
    offlineDiscussionInfo,
    onlineDiscussionInfo
  };
  const discussionState = getDiscussionStatus(discussion);

  // 상태별 색상
  const stateStyle = getDiscussionStatusStyle(discussionState);

  return (
    <div
      className={styles.discussionCard}
      onClick={() => navigate(`/discussion/${id}`)}
    >
      {/* 우측 상단 상태 박스 */}
      <div className={styles.categoryStatusContainer}>
        <span
          className={styles.statusBadge}
          style={stateStyle}
        >
          {discussionState}
        </span>
      </div>

      {/* 토론 타입 */}
      <div className={styles.discussionTypeBadge}>
        {discussionType === 'OFFLINE' ? '👥 오프라인' : '💻 온라인'}
      </div>

      {/* 제목 영역 */}
      <div className={styles.titleRow}>
        <span className={styles.categoryBadge}>{getTrackDisplayName(commonDiscussionInfo.category)}</span>
        <div className={styles.title}>
          {commonDiscussionInfo.title}
        </div>
      </div>

      {/* 요약 미리보기 - 온라인 토론이고 토론 완료 상태일 때만 표시 */}
      {commonDiscussionInfo.summary && discussionType === 'ONLINE' && (
        <div className={styles.summaryPreview}>
          <div className={styles.summaryText}>
            {commonDiscussionInfo.summary.length > 100 
              ? `${commonDiscussionInfo.summary.substring(0, 100)}...`
              : commonDiscussionInfo.summary
            }
          </div>
        </div>
      )}

      {/* 작성자 정보 */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <img
          src={getProfileImageSrc(commonDiscussionInfo.profileImage)}
          alt="프로필 이미지"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            objectFit: 'cover',
            marginRight: '12px',
            border: '2px solid #e0e0e0'
          }}
        />
        <div style={{ fontWeight: 600, fontSize: 16 }}>
          {commonDiscussionInfo.author}
        </div>
      </div>

      {discussionType === 'OFFLINE' ? (
        <>
          <div className={styles.detailsRow}>
            <span>장소: {offlineDiscussionInfo.place}</span>
            <span>시간: {offlineDiscussionInfo.startAt} ~ {offlineDiscussionInfo.endAt}</span>
          </div>
          <div className={styles.participantInfo}>
            <span>참여: {offlineDiscussionInfo.participantCount} / {offlineDiscussionInfo.maxParticipantCount}명</span>
            <span className={styles.commentInfo}>
              <img src={commentIcon} alt="댓글" width="14" height="14" style={{ color: '#666' }} />
              <span className={styles.commentCount}>{commonDiscussionInfo.commentCount}</span>
            </span>
          </div>
        </>
      ) : (
        <>
          <div className={styles.detailsRow}>
            <span>종료일: {onlineDiscussionInfo.endDate}</span>
          </div>
          <div className={styles.participantInfo}>
            <span></span>
            <span className={styles.commentInfo}>
              <img src={commentIcon} alt="댓글" width="14" height="14" style={{ color: '#666' }} />
              <span className={styles.commentCount}>{commonDiscussionInfo.commentCount}</span>
            </span>
          </div>
        </>
      )}
    </div>
  );
}
