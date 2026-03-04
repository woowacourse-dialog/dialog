import { useState } from 'react';
import clsx from 'clsx';
import styles from './Avatar.module.css';

export default function Avatar({ src, alt, name, size = 'md', className }) {
  const [imgError, setImgError] = useState(false);
  const initial = name ? name.charAt(0) : '';
  const showImage = src && !imgError;

  return (
    <div className={clsx(styles.avatar, styles[size], className)}>
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'avatar'}
          className={styles.image}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={styles.fallback}>{initial || '?'}</span>
      )}
    </div>
  );
}
