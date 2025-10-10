import React from 'react';
import { useNavigate } from 'react-router-dom';

import dialogIcon from '../assets/dialog_icon.png';
import commentIcon from '../assets/comment-icon.svg';
import styles from './DiscussionCard.module.css';

const TRACKS = [
  { id: 'FRONTEND', name: 'FE' },
  { id: 'BACKEND', name: 'BE' },
  { id: 'ANDROID', name: 'AN' },
  { id: 'COMMON', name: 'ALL' }
];

// 프로필 이미지 URL을 가져오는 함수
const getProfileImageSrc = (profileImage) => {
  if (!profileImage) return dialogIcon;
  if (profileImage.customImageUri) {
    return profileImage.customImageUri;
  }
  return profileImage.basicImageUri || dialogIcon;
};

export default function DiscussionCard({
  id,
  discussionType,
  commonDiscussionInfo,
  offlineDiscussionInfo,
  onlineDiscussionInfo
}) {
  const navigate = useNavigate();

  // 트랙 ID를 한글 이름으로 변환
  const getTrackName = (trackId) => {
    const track = TRACKS.find(t => t.id === trackId);
    return track ? track.name : trackId;
  };

  // 토론 상태 계산
  const getDiscussionState = () => {
    if (discussionType === 'ONLINE') {
      const now = new Date();
      const end = new Date(onlineDiscussionInfo.endDate);
      return now > end ? '토론 완료' : '토론 중';
    } else {
      // OFFLINE
      const now = new Date();
      const start = new Date(offlineDiscussionInfo.startAt);
      const end = new Date(offlineDiscussionInfo.endAt);

      if (now < start) {
        return offlineDiscussionInfo.participantCount >= offlineDiscussionInfo.maxParticipantCount ? '모집 완료' : '모집 중';
      } else if (now >= start && now <= end) {
        return '토론 중';
      } else {
        return '토론 완료';
      }
    }
  };

  const discussionState = getDiscussionState();

  // 상태별 색상
  const stateStyle = {
    '모집 중': { background: '#ffe066', color: '#333' },
    '모집 완료': { background: '#ff7043', color: '#fff' },
    '토론 중': { background: '#42a5f5', color: '#fff' },
    '토론 완료':   { background: '#bdbdbd', color: '#fff' }
  };

  return (
    <div
      className={styles.discussionCard}
      onClick={() => navigate(`/discussion/${id}`)}
    >
      {/* 우측 상단 상태 박스 */}
      <div className={styles.categoryStatusContainer}>
        <span
          className={styles.statusBadge}
          style={{
            background: stateStyle[discussionState].background,
            color: stateStyle[discussionState].color
          }}
        >
          {discussionState}
        </span>
      </div>

      {/* 토론 타입 */}
      <div className={styles.discussionTypeBadge}>
        {discussionType === 'OFFLINE' ? '오프라인' : '온라인'}
      </div>

      {/* 제목 영역 */}
      <div className={styles.titleRow}>
        <span className={styles.categoryBadge}>{getTrackName(commonDiscussionInfo.category)}</span>
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
          src={getProfileImageSrc(commonDiscussionInfo.author?.profileImage)}
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
