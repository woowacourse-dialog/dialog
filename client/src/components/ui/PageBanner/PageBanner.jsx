import { ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import styles from './PageBanner.module.css';

export default function PageBanner({ icon, title, subtitle, onBack, className }) {
  return (
    <div className={clsx(styles.banner, className)}>
      <div className={styles.left}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack} aria-label="뒤로 가기">
            <ChevronLeft size={20} />
          </button>
        )}
        {icon && <span className={styles.icon}>{icon}</span>}
        <div className={styles.textGroup}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
