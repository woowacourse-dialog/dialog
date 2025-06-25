import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header/Header';
import DiscussionCard from '../components/DiscussionCard';
import { fetchDiscussions } from '../api/discussion';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../hooks/useNotification';
import NotificationGuideModal from '../components/NotificationGuideModal/NotificationGuideModal';

const Home = () => {
  const { isLoggedIn } = useAuth();
  const { showGuideModal, setShowGuideModal } = useNotification(isLoggedIn);
  const navigate = useNavigate();
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
            id={item.id}
            nickname={item.author}
            participants={item.participantCount}
            maxParticipants={item.maxParticipantCount}
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
        {showGuideModal && (
            <NotificationGuideModal
                onClose={() => setShowGuideModal(false)}
            />
        )}
      </div>
      {/* 플로팅 액션 버튼 */}
      <div
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#4bd1cc',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          zIndex: 1000
        }}
        onClick={() => navigate('/discussion/new')}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
      >
        +
      </div>
    </>
  );
};

export default Home;
