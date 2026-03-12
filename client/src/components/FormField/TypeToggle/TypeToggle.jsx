import clsx from 'clsx';
import { Lock } from 'lucide-react';
import styles from './TypeToggle.module.css';

const OPTIONS = [
  { value: 'ONLINE', label: '온라인' },
  { value: 'OFFLINE', label: '오프라인' },
];

const TypeToggle = ({ value, onChange, readOnly = false }) => {
  const handleClick = (optionValue) => {
    if (readOnly) return;
    onChange(optionValue);
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>토론 유형</span>
      <div className={clsx(styles.segmentGroup, readOnly && styles.readOnly)}>
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={clsx(styles.segment, value === opt.value && styles.active)}
            aria-pressed={value === opt.value}
            onClick={() => handleClick(opt.value)}
            disabled={readOnly && value !== opt.value}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {readOnly && (
        <span className={styles.readOnlyHint}>
          <Lock size={14} /> 변경 불가
        </span>
      )}
    </div>
  );
};

export default TypeToggle;
