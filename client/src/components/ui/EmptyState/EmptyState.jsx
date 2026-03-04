import clsx from 'clsx';
import styles from './EmptyState.module.css';
import Button from '../Button/Button';

export default function EmptyState({ icon, title, message, description, actionLabel, onAction, className }) {
  return (
    <div className={clsx(styles.emptyState, className)}>
      {icon && <div className={styles.icon}>{icon}</div>}
      {title && <h3 className={styles.title}>{title}</h3>}
      <p className={styles.message}>{message}</p>
      {description && <p className={styles.description}>{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} className={styles.action}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
