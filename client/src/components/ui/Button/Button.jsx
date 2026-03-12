import clsx from 'clsx';
import styles from './Button.module.css';

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  onClick,
  type = 'button',
  className,
  ref,
  ...rest
}) {
  return (
    <button
      ref={ref}
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        loading && styles.loading,
        className,
      )}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      {...rest}
    >
      {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
      <span className={styles.label}>{loading ? '처리중...' : children}</span>
      {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
    </button>
  );
}
