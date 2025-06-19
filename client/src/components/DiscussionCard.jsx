import React from 'react';

export default function DiscussionCard({
  nickname,
  participants,
  maxParticipants,
  category,
  place,
  startAt,
  endAt,
  views,
  title,
  summary
}) {
  // 토론 상태 계산
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);
  let discussionState = '';
  if (now < start) {
    discussionState = '모집중';
  } else if (now >= start && now <= end) {
    discussionState = '진행중';
  } else {
    discussionState = '완료';
  }

  // 상태별 색상
  const stateStyle = {
    모집중: { background: '#ffe066', color: '#333' },
    진행중: { background: '#42a5f5', color: '#fff' },
    완료:   { background: '#bdbdbd', color: '#fff' }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(60,64,67,0.08)',
      padding: 24,
      marginBottom: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      border: '1px solid #e0e0e0',
      width: '100%',
      maxWidth: 600,
      boxSizing: 'border-box',
      wordBreak: 'break-all',
      position: 'relative'
    }}>
      {/* 우측 상단 카테고리/상태 박스 */}
      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8 }}>
        <span style={{
          background: '#4bd1cc',
          color: '#fff',
          borderRadius: 8,
          padding: '4px 12px',
          fontWeight: 500,
          fontSize: 13
        }}>{category}</span>
        <span style={{
          background: stateStyle[discussionState].background,
          color: stateStyle[discussionState].color,
          borderRadius: 8,
          padding: '4px 12px',
          fontWeight: 500,
          fontSize: 13
        }}>{discussionState}</span>
      </div>
      {/* 본문 */}
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{nickname}</div>
          {/* <div style={{ fontSize: 13, color: '#888' }}>{createdAt}</div> */}
        </div>
      </div>
      <div style={{ fontSize: 15, color: '#555', marginBottom: 8 }}>{summary}</div>
      <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#666', marginBottom: 4 }}>
        <span>장소: {place}</span>
        <span>시간: {startAt} ~ {endAt}</span>
      </div>
      <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#666' }}>
        <span>참여: {participants} / {maxParticipants}명</span>
        <span>조회수: {views}</span>
      </div>
    </div>
  );
} 
