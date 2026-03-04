import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import styles from './Select.module.css';

export default function Select({
  options = [],
  label,
  id,
  value,
  onChange,
  placeholder,
  disabled = false,
  error,
  className,
  ...rest
}) {
  const selectId = id || (label ? `select-${label}` : undefined);

  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && <label htmlFor={selectId} className={styles.label}>{label}</label>}
      <div className={clsx(styles.selectContainer, error && styles.error)}>
        <select
          id={selectId}
          className={styles.select}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...rest}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className={styles.chevron} />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
