import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import Header from '../../../components/Header/Header';
import './DiscussionDetailPage.css';
import { findDiscussionById, participateDiscussion } from '../../../api/discussion';
import { likeDiscussion, deleteLikeDiscussion } from '../../../api/like';
import { scrapDiscussion, deleteScrapDiscussion } from '../../../api/scrap';

const TRACKS = [
  { id: 'FRONTEND', name: '프론트엔드' },
  { id: 'BACKEND', name: '백엔드' },
  { id: 'ANDROID', name: '안드로이드' },
  { id: 'COMMON', name: '공통' }
];


const getDiscussionStatus = (startAt, endAt) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (now < start) {
    return { status: 'upcoming', label: '시작 전' };
  } else if (now > end) {
    return { status: 'ended', label: '마감됨' };
  } else {
    return { status: 'ongoing', label: '진행중' };
  }
};

const DiscussionDetailPage = () => {
  const hasFetched = useRef(false);
  const { id } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    const fetchDiscussion = async () => {
      try {
        // 임시 데이터
        const res = await findDiscussionById(id);

        setDiscussion(res.data);
        setLikeCount(res.data.likeCount);
        setIsBookmarked(res.data.isBookmarked);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch discussion:', error);
        setLoading(false);
      }
    };

    fetchDiscussion();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await participateDiscussion(discussion.id);
      alert('토론 참여가 완료되었습니다!');
    } catch (error) {
      console.error('Failed to join discussion:', error);
      alert(error.response.data.message);
    }
    setJoining(false);
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await deleteLikeDiscussion(discussion.id);
        setLikeCount(prevCount => prevCount - 1);
      } else {
        await likeDiscussion(discussion.id);
        setLikeCount(prevCount => prevCount + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to update like:', error);
      alert('좋아요 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleBookmark = async () => {
    try {
      if (isBookmarked) {
        await deleteScrapDiscussion(discussion.id);
      } else {
        await scrapDiscussion(discussion.id);
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to update bookmark:', error);
      alert('스크랩 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  if (loading) {
    return <div className="discussion-detail-loading">Loading...</div>;
  }

  if (!discussion) {
    return <div className="discussion-detail-error">토론을 찾을 수 없습니다.</div>;
  }

  const { status, label } = getDiscussionStatus(discussion.startAt, discussion.endAt);

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  };

  return (
    <div className="discussion-detail-page">
      <Header />
      <div className="discussion-detail-container">
        <div className="discussion-detail-wrapper">
          <div className="discussion-detail-header">
            <div className="discussion-header-top">
              <div className="discussion-track">{TRACKS.find(track => track.id === discussion.track).name}</div>
              <div className={`discussion-status ${status}`}>{label}</div>
            </div>
            <div className="discussion-title-row">
              <h1>{discussion.title}</h1>
              <div className="discussion-actions">
                <button 
                  className={`action-button ${isLiked ? 'liked' : ''}`}
                  onClick={handleLike}
                >
                  {isLiked ? <FaHeart /> : <FaRegHeart />}
                  <span>{likeCount}</span>
                </button>
                <button 
                  className={`action-button ${isBookmarked ? 'bookmarked' : ''}`}
                  onClick={handleBookmark}
                >
                  {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                </button>
              </div>
            </div>
            <div className="discussion-creator">
              <img src={discussion.author.profileImage} alt={discussion.author.name} className="creator-image" />
              <span className="creator-name">{discussion.author.name}</span>
              <span className="creator-created-at">님이 개설한 토론</span>
            </div>
            <div className="discussion-meta">
              <div className="meta-item">
                <span className="meta-label">장소</span>
                <span className="meta-value">{discussion.location}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">인원</span>
                <span className="meta-value">{discussion.participantCount}/{discussion.maxParticipantCount}명</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">일시</span>
                <span className="meta-value">
                  {formatDateTime(discussion.startAt)}
                </span>
              </div>
              <div className="meta-item">
                <span className="meta-label">시간</span>
                <span className="meta-value">
                  {new Date(discussion.startAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })} ~ {new Date(discussion.endAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            </div>
            <div className="discussion-participants">
              <h3>
                참여자 
                <span className="participant-count">
                  {discussion.participants.length}/{discussion.maxParticipantCount}명
                </span>
              </h3>
              <div className="participants-list">
                {discussion.participants.map(participant => (
                  <div key={participant.id} className="participant-item">
                    <span className="participant-name">{participant.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="discussion-detail-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {discussion.content}
            </ReactMarkdown>
          </div>

          <div className="discussion-join-section">
            <button 
              className="join-button" 
              onClick={handleJoin}
              disabled={joining || discussion.participantCount >= discussion.maxParticipants}
            >
              {joining ? '참여 중...' : 
               discussion.participantCount >= discussion.maxParticipants ? '인원 마감' : 
               '참여하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetailPage; 