import React from 'react';
import { useNavigate } from 'react-router-dom';

import dialogIcon from '../assets/dialog_icon.png';
import styles from './DiscussionCard.module.css';

const TRACKS = [
  { id: 'FRONTEND', name: '프론트엔드' },
  { id: 'BACKEND', name: '백엔드' },
  { id: 'ANDROID', name: '안드로이드' },
  { id: 'COMMON', name: '공통' }
];

// 프로필 이미지 URL을 가져오는 함수
const getProfileImageSrc = (profileImage) => {
  if (!profileImage) return dialogIcon; // 기본 이미지
  if (profileImage.customImageUri) {
    return profileImage.customImageUri;
  }
  return profileImage.basicImageUri || dialogIcon; // basicImageUri가 없으면 기본 이미지
};

export default function DiscussionCard({
  id,
  nickname,
  participants,
  maxParticipants,
  category,
  place,
  startAt,
  endAt,
  views,
  title,
  summary,
  profileImage
}) {
  const navigate = useNavigate();
  
  // 트랙 ID를 한글 이름으로 변환
  const getTrackName = (trackId) => {
    const track = TRACKS.find(t => t.id === trackId);
    return track ? track.name : trackId;
  };
  
  // 토론 상태 계산
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  let discussionState = '';
  if (now < start) {
    if (participants >= maxParticipants) {
      discussionState = '모집 완료';
    } else {
      discussionState = '모집 중';
    }
  
  } else if (now >= start && now <= end) {
    discussionState = '토론 중';
  } else {
    discussionState = '토론 완료';
  }

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
        <span className={styles.categoryBadge}>{getTrackName(category)}</span>
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
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <img
          src={getProfileImageSrc(profileImage)}
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
          <div style={{ fontWeight: 600, fontSize: 16 }}>{nickname}</div>
          {/* <div style={{ fontSize: 13, color: '#888' }}>{createdAt}</div> */}
        </div>
      </div>
      <div className={styles.summary}>{summary}</div>
      <div className={styles.detailsRow}>
        <span>장소: {place}</span>
        <span>시간: {startAt} ~ {endAt}</span>
      </div>
      <div className={styles.participantInfo}>
        <span>참여: {participants} / {maxParticipants}명</span>
      </div>
    </div>
  );
} 
