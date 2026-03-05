import React, { useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';
import { Sparkles, Loader, CircleAlert, Lock, Clock, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { generateDiscussionSummary } from '../../api/discussion';
import MarkdownRender from '../Markdown/MarkdownRender';
import { getDiscussionStatus } from '../../utils/discussionStatus';
import { getCurrentKST } from '../../utils/dateUtils';
import styles from './AISummary.module.css';

const AISummary = ({ discussionId, discussion, me, initialSummary, onSummaryUpdate }) => {
  const [summary, setSummary] = useState(initialSummary || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (initialSummary !== undefined) {
      setSummary(initialSummary);
    }
  }, [initialSummary]);

  const isOnline = discussion?.discussionType === 'ONLINE';
  const isAuthor = me && discussion && me.id === discussion.commonDiscussionInfo.author.id;

  const canGenerateSummary = useCallback(() => {
    if (!discussion || !me) return false;
    if (!isOnline) return false;
    if (!isAuthor) return false;

    const now = getCurrentKST();
    const endDate = new Date(discussion.onlineDiscussionInfo.endDate);
    if (now > endDate) return false;

    return true;
  }, [discussion, me, isOnline, isAuthor]);

  const isExpired = useCallback(() => {
    if (!discussion || !isOnline) return false;
    const now = getCurrentKST();
    const endDate = new Date(discussion.onlineDiscussionInfo.endDate);
    const tomorrow = new Date(endDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return now >= tomorrow;
  }, [discussion, isOnline]);

  const handleGenerateSummary = async () => {
    if (!canGenerateSummary()) return;

    setIsGenerating(true);
    setError(null);
    setHasAttemptedGeneration(true);

    try {
      const response = await generateDiscussionSummary(discussionId, 30000);
      const newSummary = response.data.summary;
      setSummary(newSummary);
      if (onSummaryUpdate) {
        onSummaryUpdate(newSummary);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setError('요약이 존재하지 않습니다.');
      setSummary('');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  // 상태 7: 오프라인 토론
  if (!isOnline) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Sparkles size={18} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>토론 요약</h3>
        </div>
        <div className={styles.restriction}>
          <Lock size={24} className={styles.restrictionIcon} />
          <h4 className={styles.restrictionTitle}>오프라인 토론</h4>
          <p className={styles.restrictionMessage}>
            오프라인 토론은 요약 기능을 제공하지 않습니다.
          </p>
        </div>
      </div>
    );
  }

  // 요약이 있는 경우 (상태 2) - 누구에게나 표시
  if (summary) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Sparkles size={18} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>토론 요약</h3>
        </div>

        <div className={styles.summaryContent}>
          <div className={clsx(styles.summaryText, isExpanded ? styles.expanded : styles.collapsed)}>
            <MarkdownRender content={summary} />
          </div>

          {summary.length > 200 && (
            <button className={styles.toggleBtn} onClick={toggleExpanded}>
              {isExpanded ? (
                <>
                  요약 접기
                  <ChevronUp size={14} />
                </>
              ) : (
                <>
                  요약 더보기
                  <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>

        <div className={styles.footer}>
          <Check size={14} className={styles.successIcon} />
          <span>AI가 생성한 요약입니다</span>
          <button
            className={styles.copyBtn}
            onClick={copyToClipboard}
            title="클립보드에 복사"
          >
            <Copy size={14} />
            {isCopied ? '복사됨!' : '복사'}
          </button>
        </div>
      </div>
    );
  }

  // 비로그인 or 비작성자 + 요약 없음 (상태 1)
  if (!me || !isAuthor) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Sparkles size={18} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>토론 요약</h3>
        </div>
        <div className={styles.empty}>
          <p>아직 토론 요약이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  // 상태 6: 종료일 이후 + 요약 없음
  if (isExpired() && !summary) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Sparkles size={18} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>토론 요약</h3>
        </div>
        <div className={styles.restriction}>
          <Clock size={24} className={styles.restrictionIcon} />
          <h4 className={styles.restrictionTitle}>요약 생성 기간 만료</h4>
          <p className={styles.restrictionMessage}>
            토론 종료일 이후에는 요약을 생성할 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  // 상태 4: 생성 중
  if (isGenerating) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Sparkles size={18} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>토론 요약</h3>
        </div>
        <div className={styles.generating}>
          <Loader size={24} className={styles.spinner} />
          <p>AI가 토론 내용을 분석하여 요약을 생성하고 있습니다...</p>
          <small>서버에서 AI 응답을 생성하는 데 시간이 걸릴 수 있습니다. (최대 30초)</small>
        </div>
      </div>
    );
  }

  // 상태 5: 생성 실패
  if (!summary && hasAttemptedGeneration && !isGenerating) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Sparkles size={18} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>토론 요약</h3>
        </div>
        <div className={styles.error}>
          <CircleAlert size={20} className={styles.errorIcon} />
          <span>{error || '요약이 존재하지 않습니다.'}</span>
          <button
            className={styles.retryBtn}
            onClick={handleGenerateSummary}
            disabled={isGenerating}
          >
            다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  // 상태 3: 작성자 + 요약 없음
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Sparkles size={18} className={styles.headerIcon} />
        <h3 className={styles.headerTitle}>토론 요약</h3>
      </div>
      <div className={styles.empty}>
        <p>이 토론의 요약이 아직 생성되지 않았습니다.</p>
        <button
          className={styles.generateBtn}
          onClick={handleGenerateSummary}
          disabled={isGenerating}
        >
          <Sparkles size={16} />
          AI 요약 생성하기
        </button>
      </div>
    </div>
  );
};

export default AISummary;
