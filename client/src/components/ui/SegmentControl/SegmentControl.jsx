import clsx from 'clsx';
import styles from './SegmentControl.module.css';

export default function SegmentControl({
  options = [],
  value,
  onChange,
  disabled = false,
  readOnly = false,
  helperText,
  className,
}) {
  const handleClick = (optionValue) => {
    if (disabled || readOnly || optionValue === value) return;
    onChange(optionValue);
  };

  return (
    <div className={clsx(styles.wrapper, className)}>
      <div
        className={clsx(styles.container, disabled && styles.disabled)}
        role="radiogroup"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={opt.value === value}
            className={clsx(styles.segment, opt.value === value && styles.active)}
            onClick={() => handleClick(opt.value)}
            disabled={disabled}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {helperText && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
