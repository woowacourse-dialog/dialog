import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import Header from '../../../components/Header/Header';
import './DiscussionDetailPage.css';
import { findDiscussionById, participateDiscussion, deleteDiscussion } from '../../../api/discussion';

import { scrapDiscussion, deleteScrapDiscussion, getScrapStatus } from '../../../api/scrap';
import { likeDiscussion, deleteLikeDiscussion, getLikeStatus } from '../../../api/like';

import useMe from '../../../hooks/useMe';

const TRACKS = [
  { id: 'FRONTEND', name: '프론트엔드' },
  { id: 'BACKEND', name: '백엔드' },
  { id: 'ANDROID', name: '안드로이드' },
  { id: 'COMMON', name: '공통' }
];

const stateStyle = {
  '모집 중': { background: '#ffe066', color: '#333' },
  '모집 완료': { background: '#ff7043', color: '#fff' },
  '토론 중': { background: '#42a5f5', color: '#fff' },
  '토론 완료':   { background: '#bdbdbd', color: '#fff' }
};


const getDiscussionStatus = (startAt, endAt, discussion) => {
  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (now < start) {
    if(discussion.participantCount >= discussion.maxParticipantCount) {
      return { status: '모집 완료', label: '모집 완료' };  
    }
    return { status: '모집 중', label: '모집 중' };
  } else if (now > end) {
    return { status: '토론 완료', label: '토론 완료' };
  } else {
    return { status: '토론 중', label: '토론 중' };
  }
};

const getAuthorProfileImageSrc = (author) => {
  // If no author or no profileImage, use default icon from public assets
  if (!author || !author.profileImage) return '/src/assets/dialog_icon.png';
  const { basicImageUri, customImageUri } = author.profileImage;
  if (customImageUri) {
    return customImageUri;
  }
  if (basicImageUri) {
    return basicImageUri;
  }
  // If both are null or undefined, return the default icon from public assets
  return '/src/assets/dialog_icon.png';
};

const DiscussionDetailPage = () => {
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const { id } = useParams();
  const { me } = useMe();
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

  useEffect(() => {
    if (!me) {
      setIsLiked(false)
      setIsBookmarked(false);
      return;
    }
    
    const fetchScrapStatus = async () => {
      try {
        const scrapStatusRes = await getScrapStatus(id);
        setIsBookmarked(scrapStatusRes.data.isScraped);
      } catch (error) {
        console.error('Failed to fetch scrap status:', error);
        setIsBookmarked(false);
      }
    };

    fetchScrapStatus();
    
    const fetchLikeStatus = async () => {
      try {
        const likeStatusRes = await getLikeStatus(id);
        setIsLiked(likeStatusRes.data.isLiked);
      } catch (error) {
        console.error('Failed to fetch like status:', error);
        setIsLiked(false);
      }
    };

    fetchLikeStatus();
  }, [id, me]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await participateDiscussion(discussion.id);
      alert('토론 참여가 완료되었습니다!');
      // 페이지 새로고침하여 참여자 목록 업데이트
      window.location.reload();
    } catch (error) {
      console.error('Failed to join discussion:', error);
      alert(error.response.data.message);
    }
    setJoining(false);
  };

  const handleEdit = () => {
    navigate(`/discussion/${id}/edit`);
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 토론을 삭제하시겠습니까?')) {
      try {
        await deleteDiscussion(id);
        alert('토론이 삭제되었습니다.');
        navigate('/');
      } catch (error) {
        console.error('Failed to delete discussion:', error);
        alert(error.response.data.message);
      }
    }
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
      alert(error.response.data.message);
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
      alert(error.response.data.message);
    }
  };

  if (loading) {
    return <div className="discussion-detail-loading">Loading...</div>;
  }

  if (!discussion) {
    return <div className="discussion-detail-error">토론을 찾을 수 없습니다.</div>;
  }

  const { status, label } = getDiscussionStatus(discussion.startAt, discussion.endAt, discussion);
  const isAuthor = me?.id === discussion.author.id;

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
              <div 
                className="discussion-status" 
                style={{
                  background: stateStyle[status].background,
                  color: stateStyle[status].color
                }}>{label}</div>
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
              <img src={getAuthorProfileImageSrc(discussion.author)} alt={discussion.author.name} className="creator-image" />
              <span className="creator-name">{discussion.author.name}</span>
              <span className="creator-created-at">님이 개설한 토론</span>
            </div>
            <div className="discussion-meta">
              <div className="meta-item">
                <span className="meta-label">장소</span>
                <span className="meta-value">{discussion.place}</span>
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
            {isAuthor ? (
              <div className="author-actions">
                <button 
                  className="edit-button" 
                  onClick={handleEdit}
                >
                  수정
                </button>
                <button 
                  className="delete-button" 
                  onClick={handleDelete}
                >
                  삭제
                </button>
              </div>
            ) : (
              <button 
                className="join-button" 
                onClick={handleJoin}
                disabled={joining || discussion.participantCount >= discussion.maxParticipantCount}
              >
                {joining ? '참여 중...' : 
                 discussion.participantCount >= discussion.maxParticipantCount ? '인원 마감' : 
                 '참여하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetailPage; 
