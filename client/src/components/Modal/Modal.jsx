import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        {title && <h3 className={styles.title}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

export default Modal;
