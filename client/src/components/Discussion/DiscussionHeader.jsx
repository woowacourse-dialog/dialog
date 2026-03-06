import { Calendar, Pencil, Trash2, Flag } from 'lucide-react';
import Badge from '../ui/Badge/Badge';
import Avatar from '../ui/Avatar/Avatar';
import Button from '../ui/Button/Button';
import MoreMenu from '../ui/MoreMenu/MoreMenu';
import { getDiscussionStatusWithLabel } from '../../utils/discussionStatus';
import { getProfileImageSrc } from '../../utils/profileImage';
import { getTrackFullName } from '../../constants/tracks';
import { formatDiscussionDate, formatTimeOnly } from '../../utils/dateUtils';
import styles from './DiscussionHeader.module.css';

const ICON_PENCIL = <Pencil size={16} />;
const ICON_TRASH = <Trash2 size={16} />;
const ICON_FLAG = <Flag size={16} />;

// Map Korean status text to Badge type keys
const STATUS_TO_TYPE = {
  '토론 중': 'active',
  '토론 완료': 'completed',
  '모집 중': 'recruiting',
  '모집 완료': 'recruitComplete',
};

const buildMenuItems = ({ isAuthor, onEdit, onDelete, onReport }) => {
  if (isAuthor) {
    return [
      { icon: ICON_PENCIL, label: '수정하기', onClick: onEdit },
      { icon: ICON_TRASH, label: '삭제하기', variant: 'danger', onClick: onDelete },
    ];
  }
  return [
    { icon: ICON_FLAG, label: '신고하기', variant: 'warning', onClick: onReport },
  ];
};

const DiscussionHeader = ({
  discussion,
  isAuthor,
  me,
  onEdit,
  onDelete,
  onReport,
  isParticipating,
  onJoin,
}) => {
  const { commonDiscussionInfo, discussionType } = discussion;
  const { status, label } = getDiscussionStatusWithLabel(discussion);
  const author = commonDiscussionInfo.author;
  const trackName = getTrackFullName(commonDiscussionInfo.category);
  const statusType = STATUS_TO_TYPE[status] || 'active';
  const isOnline = discussionType === 'ONLINE';
  const isOffline = discussionType === 'OFFLINE';

  const menuItems = buildMenuItems({ isAuthor, onEdit, onDelete, onReport });

  return (
    <div className={styles.header}>
      <div className={styles.badgeRow}>
        <div className={styles.badges}>
          <Badge variant="discussionType" type={isOnline ? 'online' : 'offline'} size="sm" />
          <Badge variant="status" type={statusType} size="sm">
            {label}
          </Badge>
          <Badge variant="track" type={commonDiscussionInfo.category} size="sm">
            {trackName}
          </Badge>
        </div>
        {me && (
          <MoreMenu items={menuItems} />
        )}
      </div>
      <h1 className={styles.title}>{commonDiscussionInfo.title}</h1>
      <div className={styles.authorInfo}>
        <Avatar
          src={getProfileImageSrc(author?.profileImage)}
          alt={author.name}
          name={author.name}
          size="md"
        />
        <div className={styles.authorMeta}>
          <span className={styles.authorName}>{author.name}</span>
          <span className={styles.authorSuffix}>님이 개설한 토론</span>
        </div>
      </div>

      {isOnline && discussion.onlineDiscussionInfo && (
        <div className={styles.infoSection}>
          <div className={styles.onlineInfo}>
            <Calendar size={16} className={styles.infoIcon} />
            <span className={styles.infoLabel}>종료일</span>
            <span className={styles.infoValue}>{discussion.onlineDiscussionInfo.endDate}</span>
          </div>
        </div>
      )}

      {isOffline && discussion.offlineDiscussionInfo && (
        <OfflineInfo
          info={discussion.offlineDiscussionInfo}
          isParticipating={isParticipating}
          isAuthor={isAuthor}
          onJoin={onJoin}
        />
      )}
    </div>
  );
};

const OfflineInfo = ({ info, isParticipating, isAuthor, onJoin }) => {
  const isFull = info.participantCount >= info.maxParticipantCount;

  const getButtonLabel = () => {
    if (isParticipating) return '참여 완료';
    if (isFull) return '인원 마감';
    return '참여하기';
  };

  return (
    <div className={styles.infoSection}>
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>장소</span>
          <span className={styles.metaValue}>{info.place}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>일시</span>
          <span className={styles.metaValue}>{formatDiscussionDate(info.startAt)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>시간</span>
          <span className={styles.metaValue}>
            {formatTimeOnly(info.startAt)} ~ {formatTimeOnly(info.endAt)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>인원</span>
          <span className={styles.metaValue}>
            {info.participantCount}/{info.maxParticipantCount}명
          </span>
        </div>
      </div>

      <div className={styles.participants}>
        <h3 className={styles.participantsTitle}>
          참여자
          <span className={styles.participantCount}>
            {info.participants?.length || 0}/{info.maxParticipantCount}명
          </span>
        </h3>
        <div className={styles.participantsList}>
          {info.participants?.map(p => (
            <span key={p.id} className={styles.participantChip}>{p.name}</span>
          ))}
        </div>
      </div>

      {!isAuthor && (
        <Button
          variant="primary"
          className={styles.joinBtn}
          onClick={onJoin}
          disabled={isParticipating || isFull}
        >
          {getButtonLabel()}
        </Button>
      )}
    </div>
  );
};

export default DiscussionHeader;
