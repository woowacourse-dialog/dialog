import clsx from 'clsx';
import styles from './Input.module.css';

export default function Input({
  label,
  id,
  placeholder,
  value,
  onChange,
  disabled = false,
  type = 'text',
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  ...rest
}) {
  const inputId = id || (label ? `input-${label}` : undefined);

  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
      <div className={clsx(styles.inputContainer, error && styles.error)}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
        <input
          id={inputId}
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          type={type}
          {...rest}
        />
        {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
      {helperText && !error && <span className={styles.helperText}>{helperText}</span>}
    </div>
  );
}
