import { Loader } from 'lucide-react';
import clsx from 'clsx';
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ message, size = 'md', fullPage = false, className }) {
  return (
    <div
      className={clsx(styles.wrapper, fullPage && styles.fullPage, className)}
      role="status"
      aria-label={message || '로딩 중'}
    >
      <Loader className={clsx(styles.spinner, styles[size])} />
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
