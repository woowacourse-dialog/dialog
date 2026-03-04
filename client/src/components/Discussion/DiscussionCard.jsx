import { useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar, MapPin, Users, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDiscussionStatus } from '../../utils/discussionStatus';
import { getProfileImageSrc } from '../../utils/profileImage';
import Badge from '../ui/Badge/Badge';
import Avatar from '../ui/Avatar/Avatar';
import Card from '../ui/Card/Card';
import MoreMenu from '../ui/MoreMenu/MoreMenu';
import styles from './DiscussionCard.module.css';

// Map Korean status text to Badge type keys
const STATUS_TO_TYPE = {
  '토론 중': 'active',
  '토론 완료': 'completed',
  '모집 중': 'recruiting',
  '모집 완료': 'recruitComplete',
};

// Map category IDs to Badge track type keys
const CATEGORY_TO_TRACK_TYPE = {
  BACKEND: 'BACKEND',
  FRONTEND: 'FRONTEND',
  ANDROID: 'ANDROID',
  COMMON: 'COMMON',
};

const DiscussionCard = ({
  id,
  discussionType,
  commonDiscussionInfo,
  offlineDiscussionInfo,
  onlineDiscussionInfo,
  onDelete,
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const discussion = { discussionType, commonDiscussionInfo, offlineDiscussionInfo, onlineDiscussionInfo };
  const status = getDiscussionStatus(discussion);
  const statusType = STATUS_TO_TYPE[status] || 'active';
  const isAuthor = currentUser?.nickname === commonDiscussionInfo.author;
  const isOnline = discussionType === 'ONLINE';

  const handleCardClick = () => navigate(`/discussion/${id}`);

  const menuItems = [
    { label: '수정', onClick: () => navigate(`/discussion/${id}/edit`) },
    { label: '삭제', variant: 'danger', onClick: () => onDelete?.(id) },
  ];

  return (
    <div className={styles.wrapper} onClick={handleCardClick} role="link" tabIndex={0}>
      <Card className={styles.card} hoverable>
        {/* Top row: type badge + status badge + MoreMenu */}
        <div className={styles.badgeRow}>
          <Badge variant="discussionType" type={isOnline ? 'online' : 'offline'} size="sm" />
          <Badge variant="status" type={statusType} size="sm" />
          {isAuthor && (
            <div className={styles.moreMenu} onClick={(e) => e.stopPropagation()}>
              <MoreMenu items={menuItems} />
            </div>
          )}
        </div>

        {/* Title row */}
        <div className={styles.titleRow}>
          <Badge variant="track" type={CATEGORY_TO_TRACK_TYPE[commonDiscussionInfo.category] || commonDiscussionInfo.category} size="sm" />
          <h3 className={styles.title}>{commonDiscussionInfo.title}</h3>
        </div>

        {/* Summary preview (online only) */}
        {isOnline && commonDiscussionInfo.summary && (
          <div className={styles.summaryPreview} data-testid="summary-preview">
            <p className={styles.summaryText}>
              {commonDiscussionInfo.summary.length > 100
                ? `${commonDiscussionInfo.summary.substring(0, 100)}...`
                : commonDiscussionInfo.summary}
            </p>
          </div>
        )}

        {/* Author */}
        <div className={styles.authorRow}>
          <Avatar
            src={getProfileImageSrc(commonDiscussionInfo.profileImage)}
            alt={commonDiscussionInfo.author}
            name={commonDiscussionInfo.author}
            size="sm"
          />
          <span className={styles.authorName}>{commonDiscussionInfo.author}</span>
        </div>

        {/* Meta info */}
        {isOnline ? (
          <OnlineMeta endDate={onlineDiscussionInfo.endDate} commentCount={commonDiscussionInfo.commentCount} />
        ) : (
          <OfflineMeta
            offlineInfo={offlineDiscussionInfo}
            commentCount={commonDiscussionInfo.commentCount}
          />
        )}
      </Card>
    </div>
  );
};

const OnlineMeta = ({ endDate, commentCount }) => (
  <div className={styles.metaRow}>
    <span className={styles.metaItem}>
      <Calendar size={14} />
      <span>종료일: {endDate}</span>
    </span>
    <span className={styles.metaItem}>
      <MessageCircle size={14} />
      <span>{commentCount}</span>
    </span>
  </div>
);

const OfflineMeta = ({ offlineInfo, commentCount }) => (
  <>
    <div className={styles.metaRow}>
      <span className={styles.metaItem}>
        <MapPin size={14} />
        <span>{offlineInfo.place}</span>
      </span>
      <span className={styles.metaItem}>
        <Clock size={14} />
        <span>{offlineInfo.startAt} ~ {offlineInfo.endAt}</span>
      </span>
    </div>
    <div className={styles.metaRow}>
      <span className={styles.metaItem}>
        <Users size={14} />
        <span>{offlineInfo.participantCount} / {offlineInfo.maxParticipantCount}명</span>
      </span>
      <span className={styles.metaItem}>
        <MessageCircle size={14} />
        <span>{commentCount}</span>
      </span>
    </div>
  </>
);

export default DiscussionCard;
