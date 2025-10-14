import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaSpinner, FaCheck, FaExclamationTriangle, FaLock, FaClock } from 'react-icons/fa';
import { generateDiscussionSummary } from '../../api/discussion';
import MarkdownRender from '../Markdown/MarkdownRender';
import { getDiscussionStatus as getDiscussionStatusUtil } from '../../utils/discussionStatus';
import './DiscussionSummary.css';

const DiscussionSummary = ({ discussionId, discussion, me, initialSummary, onSummaryUpdate }) => {
  const [summary, setSummary] = useState(initialSummary || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  // initialSummary가 변경될 때 summary 상태 업데이트
  useEffect(() => {
    if (initialSummary !== undefined) {
      setSummary(initialSummary);
    }
  }, [initialSummary]);

  // 토론 상태 확인 함수
  const getCurrentDiscussionStatus = () => {
    return getDiscussionStatusUtil(discussion);
  };

  // 요약 생성 가능 여부 확인
  const canGenerateSummary = () => {
    if (!discussion || !me) return false;
    
    // 1. 온라인 토론만 가능
    if (discussion.discussionType !== 'ONLINE') return false;
    
    // 2. 토론 생성자만 가능
    const isAuthor = me.id === discussion.commonDiscussionInfo.author.id;
    if (!isAuthor) return false;
    
    // 3. 토론 종료일 이전에만 가능
    const now = new Date();
    const endDate = new Date(discussion.onlineDiscussionInfo.endDate);
    if (now > endDate) return false;
    
    return true;
  };

  // 요약 생성 가능하지만 아직 토론이 진행 중인 경우
  const isGeneratingAllowedButInProgress = () => {
    if (!canGenerateSummary()) return false;
    
    const status = getCurrentDiscussionStatus();
    return status === '토론 중';
  };

  const handleGenerateSummary = async () => {
    if (!canGenerateSummary()) return;
    
    setIsGenerating(true);
    setError(null);
    setHasAttemptedGeneration(true);
    
    try {
      // AI 요약 생성에 충분한 시간을 주기 위해 30초 타임아웃 설정
      const response = await generateDiscussionSummary(discussionId, 30000);
      const newSummary = response.data.summary;
      setSummary(newSummary);
      
      // 부모 컴포넌트에 요약 업데이트 알림
      if (onSummaryUpdate) {
        onSummaryUpdate(newSummary);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError('요약이 존재하지 않습니다.');
      setSummary(''); // 실패 시 요약 내용 초기화
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // 조건에 따른 메시지 생성
  const getRestrictionMessage = () => {
    if (!discussion || !me) return null;
    
    const isOnline = discussion.discussionType === 'ONLINE';
    const status = getCurrentDiscussionStatus();
    const isAuthor = me.id === discussion.commonDiscussionInfo.author.id;
    
    if (!isOnline) {
      return {
        icon: <FaLock />,
        title: '오프라인 토론',
        message: '오프라인 토론은 요약 기능을 제공하지 않습니다.',
        type: 'restriction'
      };
    }
    
    // 비생성자의 경우는 별도 처리 (요약이 있으면 보여주고, 없으면 안내 메시지)
    if (!isAuthor) {
      return null; // 별도 UI로 처리
    }
    
    const now = new Date();
    const endDate = new Date(discussion.onlineDiscussionInfo.endDate);
    // 종료일 다음 날부터 토론 완료 (종료일 당일은 아직 토론 중)
    const tomorrow = new Date(endDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (now >= tomorrow) {
      // 토론 완료 이후라도 이미 요약이 있으면 요약을 보여줌
      if (summary) {
        return null; // 요약이 있으면 일반 로직으로 처리
      }
      return {
        icon: <FaClock />,
        title: '요약 생성 기간 만료',
        message: '토론 종료일 이후에는 요약을 생성할 수 없습니다.',
        type: 'restriction'
      };
    }
    
    return null;
  };

  // 비생성자를 위한 요약 표시 UI
  const renderNonAuthorSummary = () => {
    if (!discussion) return null;
    
    const isOnline = discussion.discussionType === 'ONLINE';
    const isAuthor = me && me.id === discussion.commonDiscussionInfo.author.id;
    
    // 로그인하지 않은 경우
    if (!me) {
      if (!isOnline) {
        // 오프라인 토론 + 비로그인: 오프라인 토론 안내
        return (
          <div className="discussion-summary-container">
            <div className="summary-header">
              <FaFileAlt className="summary-icon" />
              <h3>토론 요약</h3>
            </div>
            <div className="summary-restriction">
              <div className="restriction-icon"><FaLock /></div>
              <h4>오프라인 토론</h4>
              <p>오프라인 토론은 요약 기능을 제공하지 않습니다.</p>
            </div>
          </div>
        );
      } else {
        // 온라인 토론 + 비로그인
        if (summary) {
          // 요약이 있으면 표시
          return (
            <div className="discussion-summary-container">
              <div className="summary-header">
                <FaFileAlt className="summary-icon" />
                <h3>토론 요약</h3>
              </div>
              
              <div className="summary-content">
                <div className={`summary-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
                  <MarkdownRender content={summary} />
                </div>
                
                {summary.length > 200 && (
                  <button 
                    className="toggle-summary-btn"
                    onClick={toggleExpanded}
                  >
                    {isExpanded ? '요약 접기' : '요약 더보기'}
                  </button>
                )}
              </div>
              
              <div className="summary-footer">
                <FaCheck className="success-icon" />
                <span>AI가 생성한 요약입니다</span>
              </div>
            </div>
          );
        } else {
          // 요약이 없으면 단순히 존재하지 않는다고 표시
          return (
            <div className="discussion-summary-container">
              <div className="summary-header">
                <FaFileAlt className="summary-icon" />
                <h3>토론 요약</h3>
              </div>
              <div className="summary-empty">
                <p>아직 토론 요약이 존재하지 않습니다.</p>
              </div>
            </div>
          );
        }
      }
    }
    
    // 로그인한 사용자의 경우 (기존 로직)
    // 온라인 토론이 아니면 표시하지 않음
    if (!isOnline) return null;
    
    // 생성자라면 일반 로직으로 처리
    if (isAuthor) return null;
    
    // 비생성자인 경우
    if (summary) {
      // 요약이 있으면 표시
      return (
        <div className="discussion-summary-container">
          <div className="summary-header">
            <FaFileAlt className="summary-icon" />
            <h3>토론 요약</h3>
          </div>
          
          <div className="summary-content">
            <div className={`summary-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
              <MarkdownRender content={summary} />
            </div>
            
            {summary.length > 200 && (
              <button 
                className="toggle-summary-btn"
                onClick={toggleExpanded}
              >
                {isExpanded ? '요약 접기' : '요약 더보기'}
              </button>
            )}
          </div>
          
          <div className="summary-footer">
            <FaCheck className="success-icon" />
            <span>AI가 생성한 요약입니다</span>
          </div>
        </div>
      );
    } else {
      // 요약이 없으면 안내 메시지
      return (
        <div className="discussion-summary-container">
          <div className="summary-header">
            <FaFileAlt className="summary-icon" />
            <h3>토론 요약</h3>
          </div>
          <div className="summary-empty">
            <p>아직 토론 요약이 존재하지 않습니다.</p>
          </div>
        </div>
      );
    }
  };

  // 비생성자 UI 먼저 처리
  const nonAuthorUI = renderNonAuthorSummary();
  if (nonAuthorUI) {
    return nonAuthorUI;
  }

  // 제한사항이 있는 경우
  const restriction = getRestrictionMessage();
  if (restriction) {
    return (
      <div className="discussion-summary-container">
        <div className="summary-header">
          <FaFileAlt className="summary-icon" />
          <h3>토론 요약</h3>
        </div>
        <div className="summary-restriction">
          <div className="restriction-icon">{restriction.icon}</div>
          <h4>{restriction.title}</h4>
          <p>{restriction.message}</p>
        </div>
      </div>
    );
  }

  // 요약이 없고 생성 중이 아닌 경우
  if (!summary && !isGenerating && !hasAttemptedGeneration) {
    const isInProgress = isGeneratingAllowedButInProgress();
    
    return (
      <div className="discussion-summary-container">
        <div className="summary-header">
          <FaFileAlt className="summary-icon" />
          <h3>토론 요약</h3>
        </div>
        <div className="summary-empty">
          {isInProgress ? (
            <>
              <div className="summary-notice">
                <FaClock className="notice-icon" />
                <p>토론이 모두 종료되었다고 판단되는 시점에 요약을 생성해주세요.</p>
                <small>요약은 1회만 생성할 수 있습니다.</small>
              </div>
              <button 
                className="generate-summary-btn"
                onClick={handleGenerateSummary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="spinner" />
                    요약 생성 중...
                  </>
                ) : (
                  'AI 요약 생성하기'
                )}
              </button>
            </>
          ) : (
            <>
              <p>이 토론의 요약이 아직 생성되지 않았습니다.</p>
              <button 
                className="generate-summary-btn"
                onClick={handleGenerateSummary}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="spinner" />
                    요약 생성 중...
                  </>
                ) : (
                  'AI 요약 생성하기'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // API 실패한 경우
  if (!summary && hasAttemptedGeneration && !isGenerating) {
    return (
      <div className="discussion-summary-container">
        <div className="summary-header">
          <FaFileAlt className="summary-icon" />
          <h3>토론 요약</h3>
        </div>
        <div className="summary-no-content">
          <div className="error-message">
            <FaExclamationTriangle />
            {error || '요약이 존재하지 않습니다.'}
          </div>
          <button 
            className="retry-summary-btn"
            onClick={handleGenerateSummary}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <FaSpinner className="spinner" />
                재시도 중...
              </>
            ) : (
              '다시 시도하기'
            )}
          </button>
        </div>
      </div>
    );
  }

  // 요약 생성 중인 경우
  if (isGenerating) {
    return (
      <div className="discussion-summary-container">
        <div className="summary-header">
          <FaFileAlt className="summary-icon" />
          <h3>토론 요약</h3>
        </div>
        <div className="summary-generating">
          <FaSpinner className="spinner" />
          <p>AI가 토론 내용을 분석하여 요약을 생성하고 있습니다...</p>
          <small>서버에서 AI 응답을 생성하는 데 시간이 걸릴 수 있습니다. (최대 30초)</small>
        </div>
      </div>
    );
  }

  // 요약이 존재하는 경우
  if (summary) {
    return (
      <div className="discussion-summary-container">
        <div className="summary-header">
          <FaFileAlt className="summary-icon" />
          <h3>토론 요약</h3>
        </div>
        
        <div className="summary-content">
          <div className={`summary-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <MarkdownRender content={summary} />
          </div>
          
          {summary.length > 200 && (
            <button 
              className="toggle-summary-btn"
              onClick={toggleExpanded}
            >
              {isExpanded ? '요약 접기' : '요약 더보기'}
            </button>
          )}
        </div>
        
        <div className="summary-footer">
          <FaCheck className="success-icon" />
          <span>AI가 생성한 요약입니다</span>
        </div>
      </div>
    );
  }

  // 기본 상태 (조건을 만족하지 않는 경우)
  return null;
};

export default DiscussionSummary;
