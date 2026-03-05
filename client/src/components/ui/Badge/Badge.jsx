import clsx from 'clsx';
import styles from './Badge.module.css';

const STATUS_LABELS = {
  active: '토론 중',
  completed: '토론 완료',
  recruiting: '모집 중',
  recruitComplete: '모집 완료',
};

const TRACK_LABELS = {
  BACKEND: 'BE', FRONTEND: 'FE', ANDROID: 'AN', COMMON: 'ALL',
};

const TYPE_LABELS = { online: '온라인', offline: '오프라인' };

const TYPE_CLASS_MAP = {
  status: { active: 'statusActive', completed: 'statusCompleted', recruiting: 'statusRecruiting', recruitComplete: 'statusRecruitComplete' },
  track: { BACKEND: 'trackBe', FRONTEND: 'trackFe', ANDROID: 'trackAn', COMMON: 'trackCommon' },
  discussionType: { online: 'typeOnline', offline: 'typeOffline' },
};

const LABEL_MAP = { status: STATUS_LABELS, track: TRACK_LABELS, discussionType: TYPE_LABELS };

export default function Badge({ variant, type, size = 'md', children, className }) {
  const typeClassName = TYPE_CLASS_MAP[variant]?.[type] || '';
  const defaultLabel = LABEL_MAP[variant]?.[type] || type;
  const showDot = variant === 'status';

  return (
    <span className={clsx(styles.badge, styles[typeClassName], styles[size], className)}>
      {showDot && <span className={styles.dot} />}
      {children || defaultLabel}
    </span>
  );
}
