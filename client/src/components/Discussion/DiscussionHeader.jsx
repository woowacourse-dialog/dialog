import clsx from 'clsx';
import Badge from '../ui/Badge/Badge';
import Avatar from '../ui/Avatar/Avatar';
import { getDiscussionStatusWithLabel } from '../../utils/discussionStatus';
import { getProfileImageSrc } from '../../utils/profileImage';
import { getTrackFullName } from '../../constants/tracks';
import styles from './DiscussionHeader.module.css';

// Map Korean status text to Badge type keys
const STATUS_TO_TYPE = {
  '토론 중': 'active',
  '토론 완료': 'completed',
  '모집 중': 'recruiting',
  '모집 완료': 'recruitComplete',
};

const DiscussionHeader = ({ discussion }) => {
  const { commonDiscussionInfo } = discussion;
  const { status, label } = getDiscussionStatusWithLabel(discussion);
  const author = commonDiscussionInfo.author;
  const trackName = getTrackFullName(commonDiscussionInfo.category);
  const statusType = STATUS_TO_TYPE[status] || 'active';

  return (
    <div className={styles.header}>
      <div className={styles.badgeRow}>
        <Badge variant="track" type={commonDiscussionInfo.category}>
          {trackName}
        </Badge>
        <Badge variant="status" type={statusType}>
          {label}
        </Badge>
      </div>
      <h1 className={styles.title}>{commonDiscussionInfo.title}</h1>
      <div className={styles.authorInfo}>
        <Avatar
          src={getProfileImageSrc(author?.profileImage)}
          alt={author.name}
          name={author.name}
          size="md"
        />
        <span className={styles.authorName}>{author.name}</span>
        <span className={styles.authorSuffix}>님이 개설한 토론</span>
      </div>
    </div>
  );
};

export default DiscussionHeader;
