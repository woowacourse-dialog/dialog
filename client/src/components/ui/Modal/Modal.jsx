import { createPortal } from 'react-dom';
import { useEffect, useRef, useId } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import styles from './Modal.module.css';

export default function Modal({ isOpen, onClose, title, children, className }) {
  const contentRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    contentRef.current?.focus();

    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={clsx(styles.content, className)}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        ref={contentRef}
        tabIndex={-1}
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <X size={20} />
        </button>
        {title && <h3 id={titleId} className={styles.title}>{title}</h3>}
        {children}
      </div>
    </div>,
    document.body
  );
}
