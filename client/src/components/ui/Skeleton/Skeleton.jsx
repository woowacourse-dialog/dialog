import clsx from 'clsx';
import styles from './Skeleton.module.css';

export default function Skeleton({ variant = 'rect', width, height, className }) {
  return (
    <div
      className={clsx(styles.skeleton, styles[variant], className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
