import React, { useEffect, useState, useRef, useCallback } from 'react';
import Header from '../components/Header/Header';
import DiscussionCard from '../components/DiscussionCard';
import { fetchDiscussions } from '../api/discussion';

const Home = () => {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const loader = useRef(null);
  const hasFetched = useRef(false);

  // 최초 데이터 로드
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
  
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { content, nextCursor, hasNext } = await fetchDiscussions();
        setDiscussions(content);
        setNextCursor(nextCursor);
        setHasMore(hasNext);
      } catch (e) {
        setError('게시글을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // 추가 데이터 로드
  const loadMore = useCallback(async () => {
    if (!hasMore) return;
    setIsFetchingMore(true);
    try {
      const { content, nextCursor: newCursor, hasNext } = await fetchDiscussions({ cursor: nextCursor });
      setDiscussions((prev) => [...prev, ...content]);
      setNextCursor(newCursor);
      setHasMore(hasNext);
    } catch (e) {
      setError('게시글을 추가로 불러오지 못했습니다.');
      setHasMore(false);
    } finally {
      setIsFetchingMore(false);
    }
  }, [hasMore, nextCursor]);

  // Intersection Observer로 무한 스크롤 트리거
  useEffect(() => {
    if (!loader.current || !hasMore || loading || isFetchingMore) return;
    const observer = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !isFetchingMore) {
          loadMore();
      }
    }, { threshold: 1 });
    observer.observe(loader.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading, isFetchingMore]);

  return (
    <>
      <Header />
      <div className="home">
        {/* <h1 style={{ marginBottom: 32 }}>게시글 목록</h1> */}
        {loading && <div>로딩 중...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {!loading && !error && discussions.length === 0 && <div>게시글이 없습니다.</div>}
        {discussions.map((item) => (
          <DiscussionCard
            key={item.id}
            profileImage={item.author?.profileImageUrl}
            nickname={item.author?.nickname}
            createdAt={item.createdAt}
            participants={item.participantCount}
            maxParticipants={item.maxParticipantCount}
            status={item.status}
            category={item.category}
            place={item.place}
            startAt={item.startAt}
            endAt={item.endAt}
            likes={item.likeCount}
            views={item.viewCount}
            title={item.title}
            summary={item.summary}
          />
        ))}
        {hasMore && (
          <div ref={loader} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* {isFetchingMore ? '불러오는 중...' : '아래로 스크롤하여 더 보기'} */}
          </div>
        )}
        {!hasMore && !loading && discussions.length > 0 && (
          <div style={{ textAlign: 'center', color: '#888', margin: 24 }}>모든 게시물을 불러왔습니다.</div>
        )}
      </div>
    </>
  );
};

export default Home; 