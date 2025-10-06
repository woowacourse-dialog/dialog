import React from 'react';
import { useNavigate } from 'react-router-dom';

import dialogIcon from '../assets/dialog_icon.png';
import commentIcon from '../assets/comment-icon.svg';
import styles from './DiscussionCard.module.css';

const TRACKS = [
  { id: 'FRONTEND', name: '프론트엔드' },
  { id: 'BACKEND', name: '백엔드' },
  { id: 'ANDROID', name: '안드로이드' },
  { id: 'COMMON', name: '공통' }
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
      {/* 우측 상단 카테고리/상태 박스 */}
      <div className={styles.categoryStatusContainer}>
        <span className={styles.categoryBadge}>{getTrackName(commonDiscussionInfo.category)}</span>
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

      {/* 본문 */}
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
        {commonDiscussionInfo.title}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
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
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {commonDiscussionInfo.author}
          </div>
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
