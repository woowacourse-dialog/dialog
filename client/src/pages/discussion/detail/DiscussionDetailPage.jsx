import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownRender from '../../../components/Markdown/MarkdownRender';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import CommentList from '../../../components/Comment/CommentList';
import DiscussionSummary from '../../../components/DiscussionSummary/DiscussionSummary';
import { getDiscussionStatusWithLabel, getDiscussionStatusStyle } from '../../../utils/discussionStatus';
import { formatDiscussionDate, formatTimeOnly } from '../../../utils/dateUtils';
import './DiscussionDetailPage.css';
import { findDiscussionById, participateDiscussion, deleteDiscussion, isParticipating as checkIsParticipating } from '../../../api/discussion';

import { scrapDiscussion, deleteScrapDiscussion, getScrapStatus } from '../../../api/scrap';
import { likeDiscussion, deleteLikeDiscussion, getLikeStatus } from '../../../api/like';

import { useAuth } from '../../../context/AuthContext';

const TRACKS = [
  { id: 'FRONTEND', name: '프론트엔드' },
  { id: 'BACKEND', name: '백엔드' },
  { id: 'ANDROID', name: '안드로이드' },
  { id: 'COMMON', name: '공통' }
];

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
  const { currentUser: me } = useAuth();
  const [discussion, setDiscussion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isParticipating, setIsParticipating] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    
    const fetchDiscussion = async () => {
      try {
        const res = await findDiscussionById(id);
        setDiscussion(res.data);
        setLikeCount(Number(res.data.commonDiscussionInfo?.likeCount) || 0);
        setIsBookmarked(res.data.isBookmarked);
        setSummary(res.data.commonDiscussionInfo.summary || '');
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
      setIsParticipating(false);
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

    const fetchIsParticipating = async () => {
      if (!me) {
        setIsParticipating(false);
        return;
      }
      
      try {
        const participationRes = await checkIsParticipating(id);
        const participationStatus = participationRes.data?.isParticipation ?? false;
        setIsParticipating(participationStatus);
      } catch (error) {
        console.error('Failed to fetch participation status:', error);
        setIsParticipating(false);
      }
    };

    fetchIsParticipating();
  }, [id, me]);


  const handleJoin = async () => {
    if (discussion.discussionType === 'ONLINE') {
      alert('온라인 토론은 참여 기능이 없습니다. 댓글로 자유롭게 토론하세요!');
      return;
    }

    try {
      await participateDiscussion(discussion.id);
      alert('토론 참여가 완료되었습니다!');
      setIsParticipating(true);
      // 페이지 새로고침하여 참여자 목록 업데이트
      window.location.reload();
    } catch (error) {
      console.error('Failed to join discussion:', error);
      alert(error.response.data.message);
    }
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
        setLikeCount(prevCount => (Number(prevCount) || 0) - 1);
      } else {
        await likeDiscussion(discussion.id);
        setLikeCount(prevCount => (Number(prevCount) || 0) + 1);
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

  const handleSummaryUpdate = (newSummary) => {
    setSummary(newSummary);
    // discussion 객체의 summary도 업데이트
    if (discussion) {
      setDiscussion(prev => ({
        ...prev,
        commonDiscussionInfo: {
          ...prev.commonDiscussionInfo,
          summary: newSummary
        }
      }));
    }
  };

  if (loading) {
    return <div className="discussion-detail-loading">Loading...</div>;
  }

  if (!discussion) {
    return <div className="discussion-detail-error">토론을 찾을 수 없습니다.</div>;
  }

  const { status, label } = getDiscussionStatusWithLabel(discussion);
  const isAuthor = me?.id === discussion.commonDiscussionInfo.author.id;
  const isOffline = discussion.discussionType === 'OFFLINE';


  return (
    <div className="discussion-detail-page">
      <div className="discussion-detail-container">
        <div className="discussion-detail-wrapper">
          <div className="discussion-detail-header">
            <div className="discussion-header-top">
              <div className="discussion-track">{TRACKS.find(track => track.id === discussion.commonDiscussionInfo.category).name}</div>
              <div
                className="discussion-status"
                style={getDiscussionStatusStyle(status)}
              >{label}</div>
            </div>
            <div className="discussion-title-row">
              <h1>{discussion.commonDiscussionInfo.title}</h1>
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
              <img src={getAuthorProfileImageSrc(discussion.commonDiscussionInfo.author)} alt={discussion.commonDiscussionInfo.author.name} className="creator-image" />
              <span className="creator-name">{discussion.commonDiscussionInfo.author.name}</span>
              <span className="creator-created-at">님이 개설한 토론</span>
            </div>

            {isOffline ? (
              <>
                <div className="discussion-meta">
                  <div className="meta-item">
                    <span className="meta-label">장소</span>
                    <span className="meta-value">{discussion.offlineDiscussionInfo.place}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">인원</span>
                    <span className="meta-value">{discussion.offlineDiscussionInfo.participantCount}/{discussion.offlineDiscussionInfo.maxParticipantCount}명</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">일시</span>
                    <span className="meta-value">
                      {formatDiscussionDate(discussion.offlineDiscussionInfo.startAt)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">시간</span>
                    <span className="meta-value">
                      {formatTimeOnly(discussion.offlineDiscussionInfo.startAt)} ~ {formatTimeOnly(discussion.offlineDiscussionInfo.endAt)}
                    </span>
                  </div>
                </div>
                <div className="discussion-participants">
                  <h3>
                    참여자
                    <span className="participant-count">
                      {discussion.offlineDiscussionInfo.participants.length}/{discussion.offlineDiscussionInfo.maxParticipantCount}명
                    </span>
                  </h3>
                  <div className="participants-list">
                    {discussion.offlineDiscussionInfo.participants.map(participant => (
                      <div key={participant.id} className="participant-item">
                        <span className="participant-name">{participant.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="discussion-meta">
                <div className="meta-item">
                  <span className="meta-label">종료일</span>
                  <span className="meta-value">{discussion.onlineDiscussionInfo.endDate}</span>
                </div>
              </div>
            )}
          </div>

          <div className="discussion-detail-content">
            <MarkdownRender content={discussion.commonDiscussionInfo.content} />
          </div>

          {discussion.discussionType === 'ONLINE' && (
            <DiscussionSummary 
              discussionId={id}
              discussion={discussion}
              me={me}
              initialSummary={summary}
              onSummaryUpdate={handleSummaryUpdate}
            />
          )}

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
            ) : isOffline ? (
              <button
                className={`join-button ${isParticipating ? 'participated' : ''}`}
                onClick={handleJoin}
                disabled={isParticipating || discussion.offlineDiscussionInfo.participantCount >= discussion.offlineDiscussionInfo.maxParticipantCount}
              >
                {isParticipating ? '참여 완료' :
                 discussion.offlineDiscussionInfo.participantCount >= discussion.offlineDiscussionInfo.maxParticipantCount ? '인원 마감' :
                 '참여하기'}
              </button>
            ) : null}
          </div>
          <CommentList discussionId={id} />
        </div>
      </div>
    </div>
  );
};

export default DiscussionDetailPage; 
