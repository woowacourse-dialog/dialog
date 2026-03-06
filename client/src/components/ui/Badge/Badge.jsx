import clsx from 'clsx';
import { TYPE_CLASS_MAP, LABEL_MAP } from '../../../constants/badges';
import styles from './Badge.module.css';

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
