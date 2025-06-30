import React from 'react';
import DiscussionCard from './DiscussionCard';

const DiscussionList = ({
  items,
  loading,
  error,
  hasMore,
  isFetchingMore,
  loaderRef,
  emptyMessage = '게시글이 없습니다.',
  endMessage = '모든 게시물을 불러왔습니다.',
}) => {
  const listStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px', // 카드 사이의 간격
    alignItems: 'center', // 자식 요소들을 가로축 중앙에 배치
  };

  return (
    <div style={listStyles}>
      {loading && <div>로딩 중...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && items.length === 0 && <div>{emptyMessage}</div>}
      {items.map((item) => (
        <DiscussionCard
          key={item.id}
          id={item.id}
          nickname={item.author}
          participants={item.participantCount}
          maxParticipants={item.maxParticipantCount}
          category={item.category}
          place={item.place}
          startAt={item.startAt}
          endAt={item.endAt}
          views={item.viewCount}
          title={item.title}
          summary={item.summary}
        />
      ))}
      {hasMore && (
        <div ref={loaderRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* {isFetchingMore ? '불러오는 중...' : '아래로 스크롤하여 더 보기'} */}
        </div>
      )}
      {!hasMore && !loading && items.length > 0 && (
        <div style={{ textAlign: 'center', color: '#888', margin: 24 }}>{endMessage}</div>
      )}
    </div>
  );
};

export default DiscussionList; 