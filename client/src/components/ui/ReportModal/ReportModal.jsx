import { useState } from 'react';
import { Flag } from 'lucide-react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import styles from './ReportModal.module.css';

const REPORT_REASONS = [
  { value: 'SPAM', label: '스팸' },
  { value: 'INAPPROPRIATE', label: '부적절한 내용' },
  { value: 'ABUSE', label: '욕설/비하' },
  { value: 'OTHER', label: '기타' },
];

export default function ReportModal({ isOpen, onClose, onConfirm, loading = false }) {
  const [selectedReason, setSelectedReason] = useState('');

  const handleClose = () => {
    setSelectedReason('');
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason);
    setSelectedReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className={styles.modal}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Flag size={32} className={styles.flagIcon} />
        </div>
        <h3 className={styles.title}>신고하기</h3>
        <div className={styles.radioGroup}>
          {REPORT_REASONS.map(({ value, label }) => (
            <label key={value} className={styles.radioLabel}>
              <input
                type="radio"
                name="reportReason"
                value={value}
                checked={selectedReason === value}
                onChange={(e) => setSelectedReason(e.target.value)}
                className={styles.radioInput}
              />
              <span className={styles.radioText}>{label}</span>
            </label>
          ))}
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button
            variant="warning"
            onClick={handleConfirm}
            disabled={!selectedReason}
            loading={loading}
          >
            신고
          </Button>
        </div>
      </div>
    </Modal>
  );
}
