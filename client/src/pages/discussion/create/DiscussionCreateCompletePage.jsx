import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Link2, Check, MapPin, Calendar, Clock, Users } from 'lucide-react';
import styles from './DiscussionCreateCompletePage.module.css';

const DiscussionCreateCompletePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { state } = useLocation();
  const {
    title = '',
    content = '',
    trackName = '공통',
    discussionType = 'ONLINE',
    // 온라인
    endDate = '',
    // 오프라인
    location: meetingLocation = '',
    date = '',
    startTime = '',
    endTime = '',
    participantCount = 0,
  } = state || {};

  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const isOffline = discussionType === 'OFFLINE';

  const discussionUrl = useMemo(
    () => `${window.location.origin}/discussion/${id}`,
    [id],
  );

  const truncatedContent = useMemo(() => {
    if (!content) return '';
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  }, [content]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(discussionUrl);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* TitleArea */}
        <h1 className={styles.title}>작성 완료</h1>
        <p className={styles.subtitle}>아래 링크를 통해 토론에 참여해보세요.</p>

        {/* PreviewCard */}
        <div className={styles.previewCard}>
          <div className={styles.cardHeader}>
            <span className={styles.trackCircle} />
            <span className={styles.discussionTitle}>{title || `토론 #${id}`}</span>
          </div>

          {/* 메타 정보 */}
          <div className={styles.metaInfo}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>트랙</span>
              <span className={styles.metaValue}>{trackName}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>유형</span>
              <span className={styles.metaValue}>{isOffline ? '오프라인' : '온라인'}</span>
            </div>
            {isOffline ? (
              <>
                {meetingLocation && (
                  <div className={styles.metaItem}>
                    <MapPin size={14} className={styles.metaIcon} />
                    <span className={styles.metaValue}>{meetingLocation}</span>
                  </div>
                )}
                {date && (
                  <div className={styles.metaItem}>
                    <Calendar size={14} className={styles.metaIcon} />
                    <span className={styles.metaValue}>{date}</span>
                  </div>
                )}
                {startTime && endTime && (
                  <div className={styles.metaItem}>
                    <Clock size={14} className={styles.metaIcon} />
                    <span className={styles.metaValue}>{startTime} ~ {endTime}</span>
                  </div>
                )}
                {participantCount > 0 && (
                  <div className={styles.metaItem}>
                    <Users size={14} className={styles.metaIcon} />
                    <span className={styles.metaValue}>최대 {participantCount}명</span>
                  </div>
                )}
              </>
            ) : (
              endDate && (
                <div className={styles.metaItem}>
                  <Calendar size={14} className={styles.metaIcon} />
                  <span className={styles.metaValue}>종료일 {endDate}</span>
                </div>
              )
            )}
          </div>

          {truncatedContent && (
            <p className={styles.previewBody}>{truncatedContent}</p>
          )}

          <button
            type="button"
            className={styles.linkArea}
            onClick={handleCopyLink}
            aria-label="링크 복사"
          >
            <Link2 size={16} />
            <span className={styles.linkText}>{discussionUrl}</span>
          </button>
        </div>

        {/* ButtonArea */}
        <button
          type="button"
          className={styles.goToPostBtn}
          onClick={() => navigate(`/discussion/${id}`)}
        >
          게시글로 이동
        </button>

        {/* CopySuccessMessage */}
        {copied && (
          <div className={styles.copySuccess}>
            <Check size={16} />
            <span>클립보드에 복사되었습니다</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionCreateCompletePage;
